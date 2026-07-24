import { getActor } from "@/lib/server/actor";
import { newId } from "@/lib/server/api";
import {
  LlmBudgetError,
  LlmProviderError,
  streamAcadPro,
} from "@/lib/llm/router";
import { getRepository } from "@/lib/repositories";
import { progressForTurn } from "@/lib/domain/learning";
import { getUniversityCourse } from "@/lib/content/university";
import { rankMemories } from "@/lib/memory/retrieve";
import { recordAnalyticsEventSafe } from "@/lib/analytics/events";

type ClientEvent =
  | "meta"
  | "delta"
  | "progress"
  | "usage"
  | "done"
  | "error";

function event(name: ClientEvent, data: unknown) {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
}

function streamError(code: string, message: string, status = 200) {
  return new Response(event("error", { code, message }), {
    status,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as {
    content?: string;
    idempotencyKey?: string;
  };
  const content = body.content?.trim() ?? "";
  const idempotencyKey = body.idempotencyKey?.trim() ?? "";
  if (!content || content.length > 2_000 || !idempotencyKey) {
    return streamError(
      "BAD_REQUEST",
      content.length > 2_000
        ? "单条回答最多 2,000 字"
        : "回答内容或请求标识缺失",
      400,
    );
  }

  const repository = getRepository();
  const [session, actor] = await Promise.all([
    repository.getLearningSession(id),
    getActor(request),
  ]);
  if (!session) return streamError("NOT_FOUND", "学习会话不存在", 404);
  const allowed =
    (actor.userId && session.userId === actor.userId) ||
    (actor.guestId && session.guestId === actor.guestId);
  if (!allowed) return streamError("FORBIDDEN", "无权访问该会话", 403);
  if (!actor.userId && session.turnCount >= 5) {
    return streamError(
      "REGISTRATION_REQUIRED",
      "开放旁听的对话已经完成。建立学籍后，这段思考会被保留。",
      403,
    );
  }

  const existingUserMessage = await repository.findMessageByIdempotency(
    id,
    "user",
    idempotencyKey,
  );
  const existingAssistant = await repository.findMessageByIdempotency(
    id,
    "assistant",
    idempotencyKey,
  );
  if (existingAssistant) {
    return new Response(
      event("meta", { sessionId: id, replayed: true }) +
        event("delta", { text: existingAssistant.content }) +
        event("progress", {
          turnCount: session.turnCount,
          progress: session.progress,
        }) +
        event("done", { messageId: existingAssistant.id }),
      {
        headers: {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-cache, no-transform",
        },
      },
    );
  }
  const memoryCandidates = actor.userId
    ? await repository.listMemoryItems(actor.userId)
    : [];
  if (!existingUserMessage) {
    const userMessage = await repository.appendMessage({
      sessionId: id,
      role: "user",
      content,
      idempotencyKey,
    });
    if (actor.userId) {
      const course = getUniversityCourse(session.nodeSlug)?.course;
      await repository.remember({
        userId: actor.userId,
        kind: "learning",
        contextLabel: course?.title ?? session.nodeSlug,
        content,
        sourceType: "learning_message",
        sourceId: userMessage.id,
        salience: 60,
      });
    }
    await recordAnalyticsEventSafe({
      eventName: "learning_message_sent",
      request,
      userId: actor.userId,
      guestId: actor.guestId,
      properties: {
        courseSlug: session.nodeSlug,
        sessionId: id,
        turnNumber: session.turnCount + 1,
      },
    });
  }
  const history = await repository.listMessages(id);
  const memories = actor.userId
    ? rankMemories(memoryCandidates, content)
    : [];
  const nextTurn = session.turnCount + 1;
  const nextProgress = progressForTurn(session.nodeSlug, nextTurn);
  const callId = newId();
  let callReserved = false;

  const output = new TransformStream();
  const writer = output.writable.getWriter();
  const encoder = new TextEncoder();
  const write = (name: ClientEvent, data: unknown) =>
    writer.write(encoder.encode(event(name, data)));

  void (async () => {
    try {
      await write("meta", {
        sessionId: id,
        model: "acad-pro",
        promptVersion: session.promptVersion,
        memoryCount: memories.length,
        memoryContexts: [...new Set(memories.map((item) => item.contextLabel))]
          .slice(0, 3),
      });
      const result = await streamAcadPro({
        history,
        mode: { type: "course", nodeSlug: session.nodeSlug },
        memories,
        callbacks: {
          async onReserved(reservation) {
            callReserved = true;
            await repository.createLlmCall({
              id: callId,
              sessionId: id,
              userId: actor.userId,
              guestId: actor.guestId,
              providerModel: reservation.providerModel,
              reservedFen: reservation.reservedFen,
            });
          },
          async onDelta(text) {
            await write("delta", { text });
          },
        },
      });
      const assistant = await repository.appendMessage({
        sessionId: id,
        role: "assistant",
        content: result.text,
        idempotencyKey,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
      });
      await repository.updateSessionProgress(id, nextTurn, nextProgress);
      await repository.finishLlmCall({
        id: callId,
        status: "succeeded",
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        actualFen: result.actualFen,
      });
      await write("progress", {
        turnCount: nextTurn,
        progress: nextProgress,
        registrationRequired: !actor.userId && nextTurn >= 5,
      });
      await write("usage", result.usage);
      await write("done", { messageId: assistant.id });
    } catch (error) {
      if (callReserved) {
        await repository.finishLlmCall({
          id: callId,
          status: "failed",
          inputTokens: 0,
          outputTokens: 0,
          actualFen: 0,
          errorCode:
            error instanceof LlmBudgetError
              ? "BUDGET_EXCEEDED"
              : "MODEL_UNAVAILABLE",
        });
      }
      if (error instanceof LlmBudgetError) {
        await write("error", {
          code: "BUDGET_EXCEEDED",
          message: "今天的开放课堂已经结束，请明天再来。",
        });
      } else {
        console.error("learning_stream_failed", error);
        await write("error", {
          code:
            error instanceof LlmProviderError
              ? "MODEL_UNAVAILABLE"
              : "INTERNAL_ERROR",
          message: "导师暂时没有回应。你的回答已经保存，可以稍后重试。",
        });
      }
    } finally {
      await writer.close();
    }
  })();

  return new Response(output.readable, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}

import { getActor } from "@/lib/server/actor";
import { newId } from "@/lib/server/api";
import {
  LlmBudgetError,
  LlmProviderError,
  streamAcadPro,
} from "@/lib/llm/router";
import { rankMemories } from "@/lib/memory/retrieve";
import { getRepository } from "@/lib/repositories";
import { recordAnalyticsEventSafe } from "@/lib/analytics/events";

type ClientEvent = "meta" | "delta" | "usage" | "done" | "error";

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
  const actor = await getActor(request);
  if (!actor.userId) {
    return streamError("UNAUTHORIZED", "请先建立学籍", 401);
  }
  const { id } = await params;
  const body = (await request.json()) as {
    content?: string;
    idempotencyKey?: string;
  };
  const content = body.content?.trim() ?? "";
  const idempotencyKey = body.idempotencyKey?.trim() ?? "";
  if (!content || content.length > 4_000 || !idempotencyKey) {
    return streamError(
      "BAD_REQUEST",
      content.length > 4_000
        ? "单条内容最多 4,000 字"
        : "内容或请求标识缺失",
      400,
    );
  }

  const repository = getRepository();
  const thread = await repository.getAgentThread(id);
  if (!thread) return streamError("NOT_FOUND", "对话不存在", 404);
  if (thread.userId !== actor.userId) {
    return streamError("FORBIDDEN", "无权访问这段对话", 403);
  }

  const [existingUser, existingAssistant] = await Promise.all([
    repository.findAgentMessageByIdempotency(id, "user", idempotencyKey),
    repository.findAgentMessageByIdempotency(
      id,
      "assistant",
      idempotencyKey,
    ),
  ]);
  if (existingAssistant) {
    return new Response(
      event("meta", { threadId: id, replayed: true, memoryCount: 0 }) +
        event("delta", { text: existingAssistant.content }) +
        event("done", { messageId: existingAssistant.id }),
      {
        headers: {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-cache, no-transform",
        },
      },
    );
  }

  const memoryCandidates = await repository.listMemoryItems(actor.userId);
  if (!existingUser) {
    const message = await repository.appendAgentMessage({
      threadId: id,
      role: "user",
      content,
      idempotencyKey,
    });
    await repository.remember({
      userId: actor.userId,
      kind: "agent",
      contextLabel: `总 Agent：${thread.title}`,
      content,
      sourceType: "agent_message",
      sourceId: message.id,
      salience: 65,
    });
    await recordAnalyticsEventSafe({
      eventName: "agent_message_sent",
      request,
      userId: actor.userId,
      properties: { threadId: id },
    });
  }
  const history = await repository.listAgentMessages(id);
  const memories = rankMemories(memoryCandidates, content, {
    limit: 14,
    maxCharacters: 7_000,
  });
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
        threadId: id,
        model: "acad-pro",
        promptVersion: "academia-agent-zh-v1",
        memoryCount: memories.length,
        memoryContexts: [...new Set(memories.map((item) => item.contextLabel))]
          .slice(0, 4),
      });
      const result = await streamAcadPro({
        history,
        mode: { type: "general-agent" },
        memories,
        callbacks: {
          async onReserved(reservation) {
            callReserved = true;
            await repository.createLlmCall({
              id: callId,
              sessionId: id,
              userId: actor.userId,
              providerModel: reservation.providerModel,
              reservedFen: reservation.reservedFen,
            });
          },
          async onDelta(text) {
            await write("delta", { text });
          },
        },
      });
      const assistant = await repository.appendAgentMessage({
        threadId: id,
        role: "assistant",
        content: result.text,
        idempotencyKey,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
      });
      await repository.finishLlmCall({
        id: callId,
        status: "succeeded",
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        actualFen: result.actualFen,
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
      await write("error", {
        code:
          error instanceof LlmBudgetError
            ? "BUDGET_EXCEEDED"
            : error instanceof LlmProviderError
              ? "MODEL_UNAVAILABLE"
              : "INTERNAL_ERROR",
        message:
          error instanceof LlmBudgetError
            ? "今天的公共模型额度已经用完，记忆与问题都已保存。"
            : "Agent 暂时没有完成回答。你的问题和记忆已经保存，可以稍后重试。",
      });
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

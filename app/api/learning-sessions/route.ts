import { getActor, ensureGuestId } from "@/lib/server/actor";
import { apiData, apiError, shanghaiDateKey } from "@/lib/server/api";
import { getRepository } from "@/lib/repositories";

const OPENING =
  "在我们进 4P 之前，先说说你最近正在做的项目。哪怕一句话。我想知道你是从什么具体处境读这一节的。";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { nodeSlug?: string };
    if (body.nodeSlug !== "4p-stp") {
      return apiError("FORBIDDEN", "该课程尚未解锁", 403);
    }
    const repository = getRepository();
    const actor = await getActor(request);
    const guestId = actor.userId ? null : actor.guestId || (await ensureGuestId());
    const session = await repository.createLearningSession({
      nodeSlug: body.nodeSlug,
      userId: actor.userId,
      guestId,
    });
    if (guestId) {
      const allowed = await repository.reserveGuestTrial(
        guestId,
        shanghaiDateKey(),
        session.id,
      );
      if (!allowed) {
        return apiError(
          "RATE_LIMITED",
          "今天的免费试听已经使用过。注册后可以继续保存并学习。",
          429,
        );
      }
    }
    const opening = await repository.appendMessage({
      sessionId: session.id,
      role: "assistant",
      content: OPENING,
    });
    return apiData({ ...session, messages: [opening] }, { status: 201 });
  } catch (error) {
    console.error("create_learning_session_failed", error);
    return apiError("INTERNAL_ERROR", "暂时无法开始试听，请稍后再试", 500);
  }
}

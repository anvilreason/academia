import { getActor, ensureGuestId } from "@/lib/server/actor";
import { apiData, apiError, shanghaiDateKey } from "@/lib/server/api";
import { getRepository } from "@/lib/repositories";
import { mayAccessNode } from "@/lib/domain/learning";
import { getUniversityCourse } from "@/lib/content/university";
import { recordAnalyticsEventSafe } from "@/lib/analytics/events";

const OPENINGS: Record<string, string> = {
  "4p-stp":
    "在我们进 4P 之前，先说说你最近正在做的项目。哪怕一句话。我想知道你是从什么具体处境读这一节的。",
  "porter-five-forces":
    "先别画五力模型。告诉我：你所在行业里，过去一年利润被谁拿走得最多？给一个具体公司或角色，以及你判断的证据。",
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { nodeSlug?: string };
    const nodeSlug = body.nodeSlug ?? "";
    if (!OPENINGS[nodeSlug]) return apiError("NOT_FOUND", "课程不存在", 404);
    const repository = getRepository();
    const actor = await getActor(request);
    const entitled = actor.userId
      ? await repository.hasEntitlement(actor.userId, nodeSlug)
      : false;
    if (
      !mayAccessNode({
        nodeSlug,
        userId: actor.userId,
        hasEntitlement: entitled,
      })
    ) {
      return apiError(
        actor.userId ? "FORBIDDEN" : "UNAUTHORIZED",
        actor.userId
          ? "请先完成选课登记，再进入这门课"
          : "请先建立学籍，再选择这门专业课程",
        actor.userId ? 403 : 401,
      );
    }
    const guestId =
      actor.userId || nodeSlug !== "4p-stp"
        ? null
        : actor.guestId || (await ensureGuestId());
    const session = await repository.createLearningSession({
      nodeSlug,
      userId: actor.userId,
      guestId,
    });
    if (actor.userId) {
      const academicCourse = getUniversityCourse(nodeSlug);
      if (academicCourse) {
        await repository.enrollCourse(
          actor.userId,
          academicCourse.program.slug,
          nodeSlug,
        );
      }
    }
    if (guestId) {
      const allowed = await repository.reserveGuestTrial(
        guestId,
        shanghaiDateKey(),
        session.id,
      );
      if (!allowed) {
        return apiError(
          "RATE_LIMITED",
          "今天的开放旁听已经结束。建立学籍后，可以继续保留学习记录。",
          429,
        );
      }
    }
    const opening = await repository.appendMessage({
      sessionId: session.id,
      role: "assistant",
      content: OPENINGS[nodeSlug],
    });
    const academic = getUniversityCourse(nodeSlug);
    await recordAnalyticsEventSafe({
      eventName: guestId ? "trial_started" : "course_started",
      request,
      userId: actor.userId,
      guestId,
      properties: {
        courseSlug: nodeSlug,
        programSlug: academic?.program.slug,
        sessionId: session.id,
      },
    });
    return apiData({ ...session, messages: [opening] }, { status: 201 });
  } catch (error) {
    console.error("create_learning_session_failed", error);
    return apiError("INTERNAL_ERROR", "课堂暂时无法进入，请稍后再试", 500);
  }
}

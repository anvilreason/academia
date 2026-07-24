import { recordAnalyticsEventSafe } from "@/lib/analytics/events";
import { FALSE_DEMAND_PATH_SLUG } from "@/lib/domain/answer-path";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先建立学籍。", 401);
  const { slug } = await params;
  if (slug !== FALSE_DEMAND_PATH_SLUG) {
    return apiError("NOT_FOUND", "这条路径尚未开放。", 404);
  }
  const body = (await request.json()) as {
    decision?: string;
    observedResult?: string;
    nextAction?: string;
    uncertainty?: string;
    happenedAt?: string;
  };
  const decision = body.decision?.trim() ?? "";
  const observedResult = body.observedResult?.trim().slice(0, 4_000) ?? "";
  const nextAction = body.nextAction?.trim().slice(0, 2_000) ?? "";
  const uncertainty = body.uncertainty?.trim().slice(0, 2_000) ?? "";
  const happenedAt = body.happenedAt?.trim() ?? "";
  if (
    !["continue", "narrow", "change", "stop"].includes(decision) ||
    observedResult.length < 30 ||
    nextAction.length < 15 ||
    uncertainty.length < 12 ||
    !/^\d{4}-\d{2}-\d{2}/.test(happenedAt)
  ) {
    return apiError(
      "BAD_REQUEST",
      "请写明现实中发生了什么、下一步和仍然不确定的部分。",
      400,
    );
  }
  const repository = getRepository();
  const snapshot = await repository.getAnswerPathSnapshot(actor.userId, slug);
  if (!snapshot) return apiError("CONFLICT", "请先开始这条路径。", 409);
  try {
    const result = await repository.recordRealWorldOutcome({
      enrollmentId: snapshot.enrollment.id,
      userId: actor.userId,
      decision,
      observedResult,
      nextAction,
      uncertainty,
      happenedAt,
      capabilityLevel: 2,
      capabilityConfidence: 72,
    });
    await repository.remember({
      userId: actor.userId,
      kind: "real_world_outcome",
      contextLabel: `现实结果：${snapshot.baseline?.projectTitle ?? slug}`,
      content: `决定：${decision}\n现实结果：${observedResult}\n下一步：${nextAction}\n仍不确定：${uncertainty}`,
      sourceType: "real_world_outcome",
      sourceId: result.outcome.id,
      salience: 92,
    });
    for (const eventName of [
      "real_world_outcome_recorded",
      "capability_updated",
      "milestone_validated",
    ] as const) {
      await recordAnalyticsEventSafe({
        eventName,
        request,
        userId: actor.userId,
        path: `/answers/${slug}`,
        properties: {
          answerPathSlug: slug,
          decision,
          milestone: "path_completed",
          pathVersion: snapshot.enrollment.pathVersion,
          contentVersion: snapshot.enrollment.contentVersion,
          evaluationVersion: snapshot.enrollment.evaluationVersion,
        },
      });
    }
    return apiData(result);
  } catch (error) {
    if (String(error).includes("REVIEW_NOT_PASSED")) {
      return apiError(
        "CONFLICT",
        "证据表通过审阅后，才能记录最终现实结果。",
        409,
      );
    }
    throw error;
  }
}

import { recordAnalyticsEventSafe } from "@/lib/analytics/events";
import {
  FALSE_DEMAND_PATH_SLUG,
  validateBaseline,
} from "@/lib/domain/answer-path";
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
    projectTitle?: string;
    ideaSummary?: string;
    targetUser?: string;
    currentEvidence?: string;
    biggestUncertainty?: string;
    confidence?: number;
  };
  const input = {
    projectTitle: body.projectTitle?.trim().slice(0, 120) ?? "",
    ideaSummary: body.ideaSummary?.trim().slice(0, 2_000) ?? "",
    targetUser: body.targetUser?.trim().slice(0, 1_000) ?? "",
    currentEvidence: body.currentEvidence?.trim().slice(0, 2_000) ?? "",
    biggestUncertainty:
      body.biggestUncertainty?.trim().slice(0, 1_000) ?? "",
    confidence: Math.round(Number(body.confidence)),
  };
  const validation = validateBaseline(input);
  if (!validation.ok) return apiError("BAD_REQUEST", validation.message, 400);
  const repository = getRepository();
  const enrollment = await repository.getAnswerPathEnrollment(
    actor.userId,
    slug,
  );
  if (!enrollment) {
    return apiError("CONFLICT", "请先开始这条路径。", 409);
  }
  const baseline = await repository.saveBaselineDiagnosis({
    enrollmentId: enrollment.id,
    userId: actor.userId,
    ...input,
  });
  await repository.remember({
    userId: actor.userId,
    kind: "answer_path_baseline",
    contextLabel: `答案路径：${input.projectTitle}`,
    content: `想法：${input.ideaSummary}\n对象：${input.targetUser}\n最大不确定性：${input.biggestUncertainty}`,
    sourceType: "baseline_diagnosis",
    sourceId: baseline.id,
    salience: 78,
  });
  await recordAnalyticsEventSafe({
    eventName: "baseline_completed",
    request,
    userId: actor.userId,
    path: `/answers/${slug}`,
    properties: {
      answerPathSlug: slug,
      pathVersion: enrollment.pathVersion,
      contentVersion: enrollment.contentVersion,
      evaluationVersion: enrollment.evaluationVersion,
    },
  });
  return apiData(baseline);
}

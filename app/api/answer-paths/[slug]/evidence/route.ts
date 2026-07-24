import { recordAnalyticsEventSafe } from "@/lib/analytics/events";
import {
  getFormalAnswerPath,
  validateEvidence,
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
  const pathConfig = getFormalAnswerPath(slug);
  if (!pathConfig) {
    return apiError("NOT_FOUND", "这条路径尚未开放。", 404);
  }
  const body = (await request.json()) as {
    evidenceType?: string;
    subjectLabel?: string;
    content?: string;
    provenance?: string;
    observedAt?: string;
  };
  const input = {
    evidenceType: body.evidenceType?.trim() ?? "",
    subjectLabel: body.subjectLabel?.trim().slice(0, 120) ?? "",
    content: body.content?.trim().slice(0, 4_000) ?? "",
    provenance: body.provenance?.trim().slice(0, 1_000) ?? "",
    observedAt: body.observedAt?.trim().slice(0, 40) || null,
  };
  const validation = validateEvidence(input, pathConfig);
  if (!validation.ok) return apiError("BAD_REQUEST", validation.message, 400);
  const repository = getRepository();
  const snapshot = await repository.getAnswerPathSnapshot(
    actor.userId,
    slug,
  );
  if (!snapshot) return apiError("CONFLICT", "请先开始这条路径。", 409);
  if (!snapshot.baseline) {
    return apiError("CONFLICT", "请先完成基线诊断。", 409);
  }
  const evidence = await repository.addEvidenceSubmission({
    enrollmentId: snapshot.enrollment.id,
    userId: actor.userId,
    stepKey: pathConfig.requiredEvidenceTypes.some(
      (type) => type === input.evidenceType,
    )
      ? "required-evidence"
      : "field-action",
    ...input,
  });
  if (snapshot.evidence.length === 0) {
    await recordAnalyticsEventSafe({
      eventName: "action_started",
      request,
      userId: actor.userId,
      path: `/answers/${slug}`,
      properties: {
        answerPathSlug: slug,
        pathVersion: snapshot.enrollment.pathVersion,
        contentVersion: snapshot.enrollment.contentVersion,
        evaluationVersion: snapshot.enrollment.evaluationVersion,
      },
    });
  }
  await recordAnalyticsEventSafe({
    eventName: "evidence_submitted",
    request,
    userId: actor.userId,
    path: `/answers/${slug}`,
    properties: {
      answerPathSlug: slug,
      evidenceType: input.evidenceType,
      pathVersion: snapshot.enrollment.pathVersion,
      contentVersion: snapshot.enrollment.contentVersion,
      evaluationVersion: snapshot.enrollment.evaluationVersion,
    },
  });
  return apiData(evidence, { status: 201 });
}

import { recordAnalyticsEventSafe } from "@/lib/analytics/events";
import {
  FALSE_DEMAND_PATH_SLUG,
  FALSE_DEMAND_RUBRIC_VERSION,
  scoreFalseDemandArtifact,
} from "@/lib/domain/answer-path";
import {
  LlmBudgetError,
  LlmProviderError,
  streamAcadPro,
} from "@/lib/llm/router";
import { getRepository } from "@/lib/repositories";
import type { AgentMessageRecord } from "@/lib/repositories/types";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError, newId, nowIso } from "@/lib/server/api";

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
  const repository = getRepository();
  const snapshot = await repository.getAnswerPathSnapshot(actor.userId, slug);
  const artifact = snapshot?.artifacts.at(-1);
  if (!snapshot?.baseline || !artifact) {
    return apiError("CONFLICT", "请先提交需求证据表。", 409);
  }
  const alreadyReviewed = snapshot.evaluations.some(
    (item) => item.artifactId === artifact.id,
  );
  if (alreadyReviewed) {
    return apiError("CONFLICT", "这一版已经审阅，请按反馈修订后再提交。", 409);
  }
  const rubric = scoreFalseDemandArtifact({
    baseline: snapshot.baseline,
    evidence: snapshot.evidence,
    artifact,
  });
  const material = [
    `项目：${snapshot.baseline.projectTitle}`,
    `想法：${snapshot.baseline.ideaSummary}`,
    `对象：${snapshot.baseline.targetUser}`,
    `最大不确定性：${snapshot.baseline.biggestUncertainty}`,
    "用户提交的证据：",
    ...snapshot.evidence.map(
      (item, index) =>
        `${index + 1}. [${item.evidenceType}] ${item.subjectLabel}：${item.content}；来源：${item.provenance}`,
    ),
    `需求证据表 v${artifact.version}：${artifact.content}`,
    `用户贡献：${artifact.userContribution}`,
    `Agent 贡献：${artifact.agentContribution}`,
  ].join("\n");
  const message: AgentMessageRecord = {
    id: newId(),
    threadId: snapshot.enrollment.id,
    role: "user",
    content: material.slice(0, 24_000),
    idempotencyKey: null,
    inputTokens: null,
    outputTokens: null,
    createdAt: nowIso(),
  };
  const callId = newId();
  let reserved = false;
  try {
    const result = await streamAcadPro({
      history: [message],
      mode: {
        type: "answer-review",
        rubricContext: JSON.stringify({
          scores: rubric.scores,
          total: rubric.total,
          requiredRevision: rubric.requiredRevision,
          structuralGaps: rubric.weaknesses,
        }),
      },
      callbacks: {
        async onReserved(reservation) {
          reserved = true;
          await repository.createLlmCall({
            id: callId,
            sessionId: snapshot.enrollment.id,
            userId: actor.userId,
            providerModel: reservation.providerModel,
            reservedFen: reservation.reservedFen,
          });
        },
        async onDelta() {},
      },
    });
    await repository.finishLlmCall({
      id: callId,
      status: "succeeded",
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      actualFen: result.actualFen,
    });
    const evaluation = await repository.createRubricEvaluation({
      enrollmentId: snapshot.enrollment.id,
      artifactId: artifact.id,
      rubricVersion: FALSE_DEMAND_RUBRIC_VERSION,
      scoreDetail: rubric.scores,
      strengths: rubric.strengths,
      weaknesses: rubric.weaknesses,
      feedback: result.text.trim(),
      requiredRevision: rubric.requiredRevision,
    });
    await recordAnalyticsEventSafe({
      eventName: "artifact_reviewed",
      request,
      userId: actor.userId,
      path: `/answers/${slug}`,
      properties: {
        answerPathSlug: slug,
        artifactVersion: artifact.version,
        requiredRevision: rubric.requiredRevision,
        pathVersion: snapshot.enrollment.pathVersion,
        contentVersion: snapshot.enrollment.contentVersion,
        evaluationVersion: snapshot.enrollment.evaluationVersion,
        rubricVersion: FALSE_DEMAND_RUBRIC_VERSION,
      },
    });
    if (!rubric.requiredRevision) {
      await recordAnalyticsEventSafe({
        eventName: "milestone_validated",
        request,
        userId: actor.userId,
        path: `/answers/${slug}`,
        properties: {
          answerPathSlug: slug,
          milestone: "artifact_passed",
          pathVersion: snapshot.enrollment.pathVersion,
          contentVersion: snapshot.enrollment.contentVersion,
          evaluationVersion: snapshot.enrollment.evaluationVersion,
        },
      });
    }
    return apiData(evaluation);
  } catch (error) {
    if (reserved) {
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
      return apiError(
        "BUDGET_EXCEEDED",
        "今天的公共审阅额度已经用完，材料已经保存，请稍后再试。",
        429,
      );
    }
    if (error instanceof LlmProviderError) {
      return apiError(
        "MODEL_UNAVAILABLE",
        "Agent 暂时无法完成审阅，材料已经保存。",
        503,
      );
    }
    console.error("answer_path_review_failed", error);
    return apiError("INTERNAL_ERROR", "审阅暂时无法完成。", 500);
  }
}

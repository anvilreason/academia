import {
  answerPathNextStep,
  capabilityLevelLabels,
  formalAnswerPathConfigs,
  recommendNextAnswerPath,
} from "@/lib/domain/answer-path";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先建立学籍。", 401);
  const repository = getRepository();
  const enrollments = await repository.listAnswerPathEnrollments(actor.userId);
  const snapshots = await Promise.all(
    formalAnswerPathConfigs.map((config) =>
      repository.getAnswerPathSnapshot(actor.userId!, config.slug),
    ),
  );
  const paths = formalAnswerPathConfigs.map((config, index) => {
    const snapshot = snapshots[index];
    const latestEvaluation = snapshot?.evaluations.at(-1) ?? null;
    const evidenceLevel =
      snapshot?.capabilities.at(-1)?.level ??
      (snapshot?.outcome
        ? 2
        : latestEvaluation && !latestEvaluation.requiredRevision
          ? 2
          : snapshot?.artifacts.length
            ? 1
            : 0);
    return {
      slug: config.slug,
      title: config.title,
      capabilityId: config.capabilityId,
      capabilityLabel: config.capabilityLabel,
      capabilityDomain: config.capabilityDomain,
      level: evidenceLevel,
      levelLabel:
        capabilityLevelLabels[
          Math.min(capabilityLevelLabels.length - 1, evidenceLevel)
        ],
      status: snapshot?.enrollment.status ?? "not_started",
      currentStep: snapshot?.enrollment.currentStep ?? null,
      evidenceCount: snapshot?.evidence.length ?? 0,
      artifactCount: snapshot?.artifacts.length ?? 0,
      revisionCount: Math.max(0, (snapshot?.artifacts.length ?? 0) - 1),
      latestScore: latestEvaluation
        ? Object.values(latestEvaluation.scoreDetail).reduce(
            (sum, score) => sum + score,
            0,
          )
        : null,
      latestReviewRequiredRevision:
        latestEvaluation?.requiredRevision ?? null,
      outcome: snapshot?.outcome ?? null,
      sources: [
        ...(snapshot?.evidence.map((item) => ({
          type: "现实证据",
          label: item.subjectLabel,
          occurredAt: item.observedAt ?? item.createdAt,
        })) ?? []),
        ...(snapshot?.artifacts.map((item) => ({
          type: `作品 v${item.version}`,
          label: item.title,
          occurredAt: item.createdAt,
        })) ?? []),
        ...(snapshot?.evaluations.map((item) => ({
          type: item.requiredRevision ? "审阅 · 需修订" : "审阅 · 通过",
          label: item.rubricVersion,
          occurredAt: item.createdAt,
        })) ?? []),
      ].slice(-6),
      nextStep: answerPathNextStep(snapshot?.enrollment ?? null, config),
    };
  });
  const recommended = recommendNextAnswerPath(enrollments);
  return apiData({
    paths,
    summary: {
      completed: paths.filter((path) => path.status === "completed").length,
      active: paths.filter((path) => path.status === "active").length,
      evidence: paths.reduce((sum, path) => sum + path.evidenceCount, 0),
      artifacts: paths.reduce((sum, path) => sum + path.artifactCount, 0),
      revisions: paths.reduce((sum, path) => sum + path.revisionCount, 0),
    },
    recommendation: recommended
      ? {
          slug: recommended.slug,
          title: recommended.title,
          capabilityLabel: recommended.capabilityLabel,
          reason: enrollments.some(
            (item) =>
              item.pathSlug === recommended.slug &&
              item.status !== "completed",
          )
            ? "这是你最近尚未完成的路径。"
            : "这是能力地图中下一项尚未形成现实证据的能力。",
        }
      : null,
  });
}

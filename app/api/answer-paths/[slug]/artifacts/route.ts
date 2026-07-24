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
    title?: string;
    content?: string;
    userContribution?: string;
    agentContribution?: string;
  };
  const input = {
    title: body.title?.trim().slice(0, 160) ?? "",
    content: body.content?.trim().slice(0, 12_000) ?? "",
    userContribution: body.userContribution?.trim().slice(0, 2_000) ?? "",
    agentContribution: body.agentContribution?.trim().slice(0, 2_000) ?? "",
  };
  if (
    input.title.length < 2 ||
    input.content.length < 160 ||
    input.userContribution.length < 20 ||
    input.agentContribution.length < 4
  ) {
    return apiError(
      "BAD_REQUEST",
      "请提交完整的需求证据表，并说明你和 Agent 各自完成了什么。",
      400,
    );
  }
  const repository = getRepository();
  const snapshot = await repository.getAnswerPathSnapshot(actor.userId, slug);
  if (!snapshot?.baseline) {
    return apiError("CONFLICT", "请先完成基线诊断。", 409);
  }
  if (snapshot.evidence.length < 3) {
    return apiError(
      "CONFLICT",
      "至少先提交三条来自真实情境的证据，再形成第一版判断。",
      409,
    );
  }
  const artifact = await repository.createAnswerPathArtifact({
    enrollmentId: snapshot.enrollment.id,
    userId: actor.userId,
    ...input,
  });
  await repository.remember({
    userId: actor.userId,
    kind: "answer_path_artifact",
    contextLabel: `需求证据表：${input.title}`,
    content: input.content,
    sourceType: "answer_path_artifact",
    sourceId: artifact.id,
    salience: 85,
  });
  await recordAnalyticsEventSafe({
    eventName:
      artifact.version === 1 ? "artifact_submitted" : "revision_submitted",
    request,
    userId: actor.userId,
    path: `/answers/${slug}`,
    properties: {
      answerPathSlug: slug,
      artifactVersion: artifact.version,
      pathVersion: snapshot.enrollment.pathVersion,
      contentVersion: snapshot.enrollment.contentVersion,
      evaluationVersion: snapshot.enrollment.evaluationVersion,
    },
  });
  return apiData(artifact, { status: 201 });
}

import { recordAnalyticsEventSafe } from "@/lib/analytics/events";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先进入学籍账户", 401);
  const { artifactId } = await params;
  const share = await getRepository().getArtifactShareForArtifact(
    actor.userId,
    artifactId,
  );
  return apiData(share);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先进入学籍账户", 401);
  const { artifactId } = await params;
  const body = (await request.json()) as {
    title?: string;
    summary?: string;
  };
  const title = body.title?.trim().slice(0, 120) ?? "";
  const summary = body.summary?.trim().slice(0, 360) ?? "";
  if (title.length < 2 || summary.length < 12) {
    return apiError("BAD_REQUEST", "请写明作品名称和公开摘要", 400);
  }
  try {
    const share = await getRepository().publishArtifactShare({
      userId: actor.userId,
      artifactId,
      shareTitle: title,
      shareSummary: summary,
    });
    await recordAnalyticsEventSafe({
      eventName: "artifact_published",
      request,
      userId: actor.userId,
      path: `/capabilities`,
      properties: { artifactId, publicSlug: share.publicSlug },
    });
    return apiData(share, { status: 201 });
  } catch (error) {
    if (String(error).includes("ARTIFACT_NOT_FOUND")) {
      return apiError("NOT_FOUND", "作品不存在", 404);
    }
    if (String(error).includes("REVIEW_NOT_PASSED")) {
      return apiError(
        "CONFLICT",
        "作品通过量规审阅后才能生成公开证明",
        409,
      );
    }
    throw error;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先进入学籍账户", 401);
  const { artifactId } = await params;
  const share = await getRepository().revokeArtifactShare(
    actor.userId,
    artifactId,
  );
  if (!share) return apiError("NOT_FOUND", "公开证明不存在", 404);
  await recordAnalyticsEventSafe({
    eventName: "artifact_unpublished",
    request,
    userId: actor.userId,
    path: `/capabilities`,
    properties: { artifactId, publicSlug: share.publicSlug },
  });
  return apiData(share);
}

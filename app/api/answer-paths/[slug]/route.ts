import { recordAnalyticsEventSafe } from "@/lib/analytics/events";
import { getFormalAnswerPath } from "@/lib/domain/answer-path";
import {
  ANSWER_CONTENT_VERSION,
  ANSWER_EVALUATION_VERSION,
} from "@/lib/content/answer-paths";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const actor = await getActor(request);
  if (!actor.userId) {
    return apiError("UNAUTHORIZED", "建立学籍后，路径才能持续保存。", 401);
  }
  const { slug } = await params;
  if (!getFormalAnswerPath(slug)) {
    return apiError("NOT_FOUND", "这条路径尚未开放。", 404);
  }
  const snapshot = await getRepository().getAnswerPathSnapshot(
    actor.userId,
    slug,
  );
  return apiData(snapshot);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const actor = await getActor(request);
  if (!actor.userId) {
    return apiError("UNAUTHORIZED", "请先建立学籍，再开始这条路径。", 401);
  }
  const { slug } = await params;
  const pathConfig = getFormalAnswerPath(slug);
  if (!pathConfig) {
    return apiError("NOT_FOUND", "这条路径尚未开放。", 404);
  }
  const repository = getRepository();
  const enrollments = await repository.listAnswerPathEnrollments(actor.userId);
  const existing = await repository.getAnswerPathEnrollment(actor.userId, slug);
  const enrollment = await repository.startAnswerPath({
    userId: actor.userId,
    pathSlug: slug,
    pathVersion: pathConfig.pathVersion,
    contentVersion: ANSWER_CONTENT_VERSION,
    evaluationVersion: ANSWER_EVALUATION_VERSION,
  });
  if (!existing) {
    await recordAnalyticsEventSafe({
      eventName: "answer_path_started",
      request,
      userId: actor.userId,
      path: `/answers/${slug}`,
      properties: {
        answerPathSlug: slug,
        pathVersion: pathConfig.pathVersion,
        contentVersion: ANSWER_CONTENT_VERSION,
        evaluationVersion: ANSWER_EVALUATION_VERSION,
      },
    });
    if (enrollments.some((item) => item.pathSlug !== slug)) {
      await recordAnalyticsEventSafe({
        eventName: "next_path_started",
        request,
        userId: actor.userId,
        path: `/answers/${slug}`,
        properties: {
          answerPathSlug: slug,
          pathVersion: pathConfig.pathVersion,
        },
      });
    }
  }
  return apiData(enrollment, { status: existing ? 200 : 201 });
}

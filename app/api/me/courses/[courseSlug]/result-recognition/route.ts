import { recordAnalyticsEventSafe } from "@/lib/analytics/events";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";
import {
  getCourseResultRecognitionState,
  recognizeCompletedPathResult,
} from "@/lib/server/result-recognition";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseSlug: string }> },
) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先进入学籍账户", 401);
  const { courseSlug } = await params;
  const state = await getCourseResultRecognitionState(
    getRepository(),
    actor.userId,
    courseSlug,
  );
  if (!state) return apiError("NOT_FOUND", "课程不存在", 404);
  return apiData(state);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseSlug: string }> },
) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先进入学籍账户", 401);
  const { courseSlug } = await params;
  const body = (await request.json()) as { enrollmentId?: string };
  if (!body.enrollmentId) {
    return apiError("BAD_REQUEST", "请选择要用于认定的现实成果", 400);
  }
  try {
    const record = await recognizeCompletedPathResult({
      repository: getRepository(),
      userId: actor.userId,
      courseSlug,
      enrollmentId: body.enrollmentId,
    });
    await recordAnalyticsEventSafe({
      eventName: "result_recognition_created",
      request,
      userId: actor.userId,
      path: `/courses/${courseSlug}`,
      properties: {
        courseSlug,
        answerPathSlug: record.pathSlug,
        recognizedCredits: record.recognizedCredits,
        knowledgeGraphVersion: record.graphVersion,
      },
    });
    return apiData(record, { status: 201 });
  } catch (error) {
    const code = String(error);
    if (code.includes("COURSE_NOT_FOUND")) {
      return apiError("NOT_FOUND", "课程不存在", 404);
    }
    if (code.includes("COURSE_NOT_FORMALLY_OPEN")) {
      return apiError(
        "CONFLICT",
        "这门课程尚未正式开放，暂不写入学分记录",
        409,
      );
    }
    if (code.includes("RESULT_ALREADY_USED")) {
      return apiError(
        "CONFLICT",
        "同一份现实成果已经用于另一门课程，不能重复抵扣",
        409,
      );
    }
    if (
      code.includes("RESULT_NOT_ELIGIBLE") ||
      code.includes("NO_RECOGNITION_CAPACITY")
    ) {
      return apiError(
        "CONFLICT",
        "该成果尚未满足这门课程的实践认定条件",
        409,
      );
    }
    throw error;
  }
}

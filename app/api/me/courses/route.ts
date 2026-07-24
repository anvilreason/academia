import { getUniversityCourse } from "@/lib/content/university";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";
import { recordAnalyticsEventSafe } from "@/lib/analytics/events";

export async function POST(request: Request) {
  const actor = await getActor(request);
  if (!actor.userId) {
    return apiError("UNAUTHORIZED", "请先建立学籍，再选择课程", 401);
  }
  const body = (await request.json()) as { courseSlug?: string };
  const result = body.courseSlug
    ? getUniversityCourse(body.courseSlug)
    : null;
  if (!result) return apiError("BAD_REQUEST", "课程不存在", 400);
  const course = await getRepository().enrollCourse(
    actor.userId,
    result.program.slug,
    result.course.slug,
  );
  await recordAnalyticsEventSafe({
    eventName: "course_enrolled",
    request,
    userId: actor.userId,
    properties: {
      courseSlug: result.course.slug,
      programSlug: result.program.slug,
    },
  });
  return apiData(course, { status: 201 });
}

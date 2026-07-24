import { getUniversityCourse } from "@/lib/content/university";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

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
  return apiData(course, { status: 201 });
}

import {
  getUniversityCourse,
  getUniversityProgram,
} from "@/lib/content/university";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

export async function GET(request: Request) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先登录查看学籍", 401);
  const plan = await getRepository().getAcademicPlan(actor.userId);
  return apiData({
    programs: plan.programs.map((record) => ({
      ...record,
      name:
        getUniversityProgram(record.programSlug)?.name ?? record.programSlug,
    })),
    courses: plan.courses.map((record) => ({
      ...record,
      title:
        getUniversityCourse(record.courseSlug)?.course.title ??
        record.courseSlug,
    })),
  });
}

export async function POST(request: Request) {
  const actor = await getActor(request);
  if (!actor.userId) {
    return apiError("UNAUTHORIZED", "请先注册或登录，再新增专业", 401);
  }
  const body = (await request.json()) as { programSlug?: string };
  if (!body.programSlug || !getUniversityProgram(body.programSlug)) {
    return apiError("BAD_REQUEST", "专业不存在", 400);
  }
  const program = await getRepository().enrollProgram(
    actor.userId,
    body.programSlug,
  );
  return apiData(program, { status: 201 });
}

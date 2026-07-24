import { getUniversityProgram } from "@/lib/content/university";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

export async function GET(request: Request) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先登录查看学籍", 401);
  return apiData(await getRepository().getAcademicPlan(actor.userId));
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

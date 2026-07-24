import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

export async function GET(request: Request) {
  const actor = await getActor(request);
  if (!actor.userId) {
    return apiError("UNAUTHORIZED", "请先建立学籍，再使用实践项目", 401);
  }
  return apiData(await getRepository().listPracticeProjects(actor.userId));
}

export async function POST(request: Request) {
  const actor = await getActor(request);
  if (!actor.userId) {
    return apiError("UNAUTHORIZED", "请先建立学籍，再创建实践项目", 401);
  }
  const body = (await request.json()) as {
    title?: string;
    context?: string;
    goal?: string;
  };
  const title = body.title?.trim() ?? "";
  const context = body.context?.trim() ?? "";
  const goal = body.goal?.trim() ?? "";
  if (!title || !context || !goal) {
    return apiError(
      "BAD_REQUEST",
      "请写下项目名称、真实处境与希望改变的结果",
      400,
    );
  }
  if (title.length > 80 || context.length > 800 || goal.length > 400) {
    return apiError("BAD_REQUEST", "项目内容超过长度限制", 400);
  }
  const project = await getRepository().createPracticeProject({
    userId: actor.userId,
    title,
    context,
    goal,
  });
  return apiData(project, { status: 201 });
}

import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

export async function GET(request: Request) {
  const actor = await getActor(request);
  if (!actor.userId) {
    return apiError("UNAUTHORIZED", "请先建立学籍，再打开长期 Agent", 401);
  }
  return apiData(await getRepository().listAgentThreads(actor.userId));
}

export async function POST(request: Request) {
  const actor = await getActor(request);
  if (!actor.userId) {
    return apiError("UNAUTHORIZED", "请先建立学籍，再开始新的思考", 401);
  }
  const body = (await request.json().catch(() => ({}))) as { title?: string };
  const thread = await getRepository().createAgentThread(
    actor.userId,
    body.title?.trim().slice(0, 80),
  );
  return apiData(thread, { status: 201 });
}

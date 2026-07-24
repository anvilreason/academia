import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getActor(request);
  if (!actor.userId) {
    return apiError("UNAUTHORIZED", "请先建立学籍", 401);
  }
  const { id } = await params;
  const repository = getRepository();
  const thread = await repository.getAgentThread(id);
  if (!thread) return apiError("NOT_FOUND", "对话不存在", 404);
  if (thread.userId !== actor.userId) {
    return apiError("FORBIDDEN", "无权访问这段对话", 403);
  }
  return apiData({
    ...thread,
    messages: await repository.listAgentMessages(id),
  });
}

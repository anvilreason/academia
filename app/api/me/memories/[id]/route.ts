import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getActor(request);
  if (!actor.userId) {
    return apiError("UNAUTHORIZED", "请先建立学籍", 401);
  }
  const { id } = await params;
  const forgotten = await getRepository().forgetMemory(actor.userId, id);
  if (!forgotten) return apiError("NOT_FOUND", "这段记忆不存在", 404);
  return apiData({ id, forgotten: true });
}

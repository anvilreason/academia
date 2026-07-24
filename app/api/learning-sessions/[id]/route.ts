import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";
import { getRepository } from "@/lib/repositories";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const repository = getRepository();
  const [session, actor] = await Promise.all([
    repository.getLearningSession(id),
    getActor(_request),
  ]);
  if (!session) return apiError("NOT_FOUND", "学习会话不存在", 404);
  const allowed =
    (actor.userId && session.userId === actor.userId) ||
    (actor.guestId && session.guestId === actor.guestId);
  if (!allowed) return apiError("FORBIDDEN", "无权查看该会话", 403);
  const sessionMessages = await repository.listMessages(id);
  return apiData({ ...session, messages: sessionMessages });
}

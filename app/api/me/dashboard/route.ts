import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

export async function GET(request: Request) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先登录", 401);
  const dashboard = await getRepository().getDashboard(actor.userId);
  const completedPorter = dashboard.sessions.some(
    (session) =>
      session.nodeSlug === "porter-five-forces" &&
      session.status === "completed",
  );
  return apiData({
    ...dashboard,
    recommendation: completedPorter
      ? {
          slug: "disruptive-innovation",
          title: "颠覆式创新：好公司为什么仍会失败",
        }
      : null,
  });
}

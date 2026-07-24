import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";
import { runtimeEnv } from "@/lib/server/env";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (runtimeEnv().PAYMENT_MODE !== "test") {
    return apiError("NOT_FOUND", "测试确认接口在生产支付模式下不可用", 404);
  }
  const actor = await getActor(request);
  if (!actor.userId) {
    return apiError("UNAUTHORIZED", "请先登录", 401);
  }
  const { id } = await params;
  try {
    const order = await getRepository().confirmTestOrder(id, actor.userId);
    return apiData({ ...order, warning: "测试订单，不会产生真实扣款" });
  } catch {
    return apiError("NOT_FOUND", "订单不存在", 404);
  }
}

import { nodePriceFen } from "@/lib/domain/orders";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

export async function POST(request: Request) {
  const actor = await getActor(request);
  if (!actor.userId) {
    return apiError("UNAUTHORIZED", "请先建立学籍，再完成选课登记", 401);
  }
  const body = (await request.json()) as {
    nodeSlug?: string;
    idempotencyKey?: string;
  };
  const nodeSlug = body.nodeSlug ?? "";
  const amountFen = nodePriceFen(nodeSlug);
  if (!amountFen || !body.idempotencyKey) {
    return apiError("BAD_REQUEST", "课程或请求标识无效", 400);
  }
  const order = await getRepository().createOrder({
    userId: actor.userId,
    nodeSlug,
    amountFen,
    idempotencyKey: body.idempotencyKey,
  });
  return apiData(order, { status: 201 });
}

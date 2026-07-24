import { membershipForCompletedSpend } from "@/lib/domain/grading";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";
import { runtimeEnv } from "@/lib/server/env";

const allowedAmounts = new Set([
  30_000, 50_000, 100_000, 200_000, 500_000, 1_000_000,
]);

export async function POST(request: Request) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先登录再测试储值", 401);
  if (runtimeEnv().PAYMENT_MODE !== "test") {
    return apiError("NOT_FOUND", "生产环境已关闭测试储值接口", 404);
  }
  const body = (await request.json()) as { amountFen?: number };
  if (!body.amountFen || !allowedAmounts.has(body.amountFen)) {
    return apiError("BAD_REQUEST", "请选择页面提供的储值金额", 400);
  }
  const wallet = await getRepository().topUpWallet(
    actor.userId,
    body.amountFen,
  );
  return apiData({
    ...wallet,
    membership: membershipForCompletedSpend(wallet.completedSpendFen),
    testOnly: true,
  });
}

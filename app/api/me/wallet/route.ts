import { membershipForCompletedSpend } from "@/lib/domain/grading";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

export async function GET(request: Request) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先登录查看学籍卡", 401);
  const wallet = await getRepository().getWallet(actor.userId);
  return apiData({
    ...wallet,
    membership: membershipForCompletedSpend(wallet.completedSpendFen),
  });
}

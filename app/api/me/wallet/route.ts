import { membershipForCompletedSpend } from "@/lib/domain/grading";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

export async function GET(request: Request) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先进入学籍账户", 401);
  const wallet = await getRepository().getWallet(actor.userId);
  return apiData({
    ...wallet,
    membership: membershipForCompletedSpend(wallet.completedSpendFen),
  });
}

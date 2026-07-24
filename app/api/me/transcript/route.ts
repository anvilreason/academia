import { weightedGpa } from "@/lib/domain/grading";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

export async function GET(request: Request) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先登录查看成绩", 401);
  const attempts = await getRepository().listExamAttempts(actor.userId);
  const best = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    const current = best.get(attempt.nodeSlug);
    if (!current || attempt.score > current.score) best.set(attempt.nodeSlug, attempt);
  }
  const records = [...best.values()];
  return apiData({
    attempts,
    records,
    earnedCredits: records.reduce(
      (sum, record) => sum + record.creditsEarned,
      0,
    ),
    gpa: weightedGpa(
      records
        .filter((record) => record.passed)
        .map((record) => ({
          credits: record.creditsEarned,
          gradePoint: record.gradePoint,
        })),
    ),
  });
}

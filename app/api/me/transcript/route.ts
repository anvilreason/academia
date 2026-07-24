import { weightedGpa } from "@/lib/domain/grading";
import { getUniversityCourse } from "@/lib/content/university";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

export async function GET(request: Request) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先进入学籍账户", 401);
  const attempts = await getRepository().listExamAttempts(actor.userId);
  const best = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    const current = best.get(attempt.nodeSlug);
    if (!current || attempt.score > current.score) best.set(attempt.nodeSlug, attempt);
  }
  const records = [...best.values()].map((record) => {
    const academic = getUniversityCourse(record.nodeSlug);
    return {
      ...record,
      courseTitle: academic?.course.title ?? record.nodeSlug,
      courseCode: academic?.course.code ?? record.nodeSlug,
    };
  });
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

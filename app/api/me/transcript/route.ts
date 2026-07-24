import { weightedGpa } from "@/lib/domain/grading";
import { getUniversityCourse } from "@/lib/content/university";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

export async function GET(request: Request) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先进入学籍账户", 401);
  const repository = getRepository();
  const [attempts, plan] = await Promise.all([
    repository.listExamAttempts(actor.userId),
    repository.getAcademicPlan(actor.userId),
  ]);
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
  const recognitions = plan.courses
    .filter((record) => Boolean(record.recognitionType))
    .map((record) => {
      const target = getUniversityCourse(record.courseSlug);
      const source = record.sourceCourseSlug
        ? getUniversityCourse(record.sourceCourseSlug)
        : null;
      return {
        ...record,
        targetTitle: target?.course.title ?? record.courseSlug,
        targetCode: target?.course.code ?? record.courseSlug,
        sourceTitle:
          source?.course.title ?? record.sourceCourseSlug ?? "既有课程",
      };
    });
  return apiData({
    attempts,
    records,
    earnedCredits: records.reduce(
      (sum, record) => sum + record.creditsEarned,
      0,
    ),
    recognitions,
    recognizedCredits: recognitions.reduce(
      (sum, record) => sum + record.recognizedCredits,
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

import {
  getAllUniversityCourses,
  getUniversityCourse,
  getUniversityProgram,
} from "@/lib/content/university";
import {
  CREDIT_PRICE_FEN,
  evaluateCourseTransfer,
  type TransferDecision,
} from "@/lib/domain/course-transfer";
import type {
  AcademiaRepository,
  UserCoursePlanRecord,
} from "@/lib/repositories/types";
import { getCourseResultRecognitionState } from "@/lib/server/result-recognition";

export type CourseRecognitionQuote = TransferDecision & {
  targetCourseSlug: string;
  targetCourseTitle: string;
  targetCredits: number;
  targetRigorLevel: number;
  status:
    | "completed"
    | "recognized"
    | "bridge_required"
    | "result_recognized"
    | "eligible"
    | "unavailable";
  existingPlan: UserCoursePlanRecord | null;
  resultRecognizedCredits: number;
  resultRecognitionCount: number;
};

async function completedCourseSlugs(
  repository: AcademiaRepository,
  userId: string,
) {
  const attempts = await repository.listExamAttempts(userId);
  return new Set(
    attempts
      .filter((attempt) => attempt.passed)
      .map((attempt) => attempt.nodeSlug),
  );
}

export async function getCourseRecognitionQuote(
  repository: AcademiaRepository,
  userId: string,
  targetCourseSlug: string,
): Promise<CourseRecognitionQuote | null> {
  const target = getUniversityCourse(targetCourseSlug);
  if (!target) return null;
  const [completedSlugs, plan, resultState] = await Promise.all([
    completedCourseSlugs(repository, userId),
    repository.getAcademicPlan(userId),
    getCourseResultRecognitionState(repository, userId, targetCourseSlug),
  ]);
  const resultRecognizedCredits = resultState?.recognizedCredits ?? 0;
  const resultRecognitionCount = resultState?.recognitions.length ?? 0;
  const existingPlan =
    plan.courses.find((course) => course.courseSlug === targetCourseSlug) ??
    null;

  if (completedSlugs.has(targetCourseSlug)) {
    return {
      type: "full",
      sourceCourseSlug: targetCourseSlug,
      sourceCourseTitle: target.course.title,
      recognizedCredits: target.course.credits,
      remainingCredits: 0,
      priceFen: 0,
      reason: "这门课程已经通过期末评价",
      targetCourseSlug,
      targetCourseTitle: target.course.title,
      targetCredits: target.course.credits,
      targetRigorLevel: target.course.rigorLevel,
      status: "completed",
      existingPlan,
      resultRecognizedCredits: 0,
      resultRecognitionCount,
    };
  }

  if (
    existingPlan?.status === "recognized" ||
    existingPlan?.status === "bridge_required"
  ) {
    const baseRecognizedCredits = existingPlan.recognizedCredits;
    const totalRecognizedCredits =
      existingPlan.status === "recognized"
        ? target.course.credits
        : Math.min(
            target.course.credits - 1,
            baseRecognizedCredits + resultRecognizedCredits,
          );
    const remainingCredits = Math.max(
      0,
      target.course.credits - totalRecognizedCredits,
    );
    return {
      type: existingPlan.recognitionType === "full" ? "full" : "bridge",
      sourceCourseSlug: existingPlan.sourceCourseSlug,
      sourceCourseTitle: existingPlan.sourceCourseSlug
        ? getUniversityCourse(existingPlan.sourceCourseSlug)?.course.title ??
          existingPlan.sourceCourseSlug
        : null,
      recognizedCredits: totalRecognizedCredits,
      remainingCredits,
      priceFen: remainingCredits * CREDIT_PRICE_FEN,
      reason:
        existingPlan.status === "recognized"
          ? "课程互认已写入当前专业的培养方案"
          : `差异学习路径已建立，只需完成剩余 ${existingPlan.remainingCredits} 学分`,
      targetCourseSlug,
      targetCourseTitle: target.course.title,
      targetCredits: target.course.credits,
      targetRigorLevel: target.course.rigorLevel,
      status: existingPlan.status,
      existingPlan,
      resultRecognizedCredits:
        existingPlan.status === "recognized" ? 0 : resultRecognizedCredits,
      resultRecognitionCount,
    };
  }

  const completedCourses = getAllUniversityCourses()
    .filter(({ course }) => completedSlugs.has(course.slug))
    .map(({ course }) => course);
  const decision = evaluateCourseTransfer(target.course, completedCourses);
  const transferRecognizedCredits = decision.recognizedCredits;
  const combinedRecognizedCredits =
    decision.type === "full"
      ? target.course.credits
      : Math.min(
          target.course.credits - 1,
          transferRecognizedCredits + resultRecognizedCredits,
        );
  const remainingCredits = Math.max(
    0,
    target.course.credits - combinedRecognizedCredits,
  );
  return {
    ...decision,
    recognizedCredits: combinedRecognizedCredits,
    remainingCredits,
    priceFen: remainingCredits * CREDIT_PRICE_FEN,
    reason:
      resultRecognizedCredits > 0
        ? `${decision.reason}；另有 ${resultRecognizedCredits} 学分来自已验证的真实作品`
        : decision.reason,
    targetCourseSlug,
    targetCourseTitle: target.course.title,
    targetCredits: target.course.credits,
    targetRigorLevel: target.course.rigorLevel,
    status:
      decision.type === "none" && resultRecognizedCredits > 0
        ? "result_recognized"
        : decision.type === "none"
          ? "unavailable"
          : "eligible",
    existingPlan,
    resultRecognizedCredits,
    resultRecognitionCount,
  };
}

export async function getProgramRecognitionAudit(
  repository: AcademiaRepository,
  userId: string,
  programSlug: string,
) {
  const program = getUniversityProgram(programSlug);
  if (!program) return null;
  const quotes = await Promise.all(
    program.courses.map((course) =>
      getCourseRecognitionQuote(repository, userId, course.slug),
    ),
  );
  const courses = quotes.filter(
    (quote): quote is CourseRecognitionQuote => Boolean(quote),
  );
  return {
    program: {
      slug: program.slug,
      name: program.name,
      requiredCredits: program.requiredCredits,
    },
    courses,
    completedCredits: courses
      .filter((course) => course.status === "completed")
      .reduce((sum, course) => sum + course.targetCredits, 0),
    recognizedCredits: courses
      .filter(
        (course) =>
          course.status === "recognized" ||
          course.status === "bridge_required" ||
          (course.status === "eligible" && course.type !== "none"),
      )
      .reduce((sum, course) => sum + course.recognizedCredits, 0),
    remainingCredits: courses.reduce(
      (sum, course) =>
        sum +
        (course.status === "completed" || course.status === "recognized"
          ? 0
          : course.remainingCredits),
      0,
    ),
    netPriceFen: courses.reduce(
      (sum, course) =>
        sum +
        (course.status === "completed" || course.status === "recognized"
          ? 0
          : course.priceFen),
      0,
    ),
  };
}

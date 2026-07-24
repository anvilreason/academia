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

export type CourseRecognitionQuote = TransferDecision & {
  targetCourseSlug: string;
  targetCourseTitle: string;
  targetCredits: number;
  targetRigorLevel: number;
  status:
    | "completed"
    | "recognized"
    | "bridge_required"
    | "eligible"
    | "unavailable";
  existingPlan: UserCoursePlanRecord | null;
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
  const [completedSlugs, plan] = await Promise.all([
    completedCourseSlugs(repository, userId),
    repository.getAcademicPlan(userId),
  ]);
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
    };
  }

  if (
    existingPlan?.status === "recognized" ||
    existingPlan?.status === "bridge_required"
  ) {
    return {
      type: existingPlan.recognitionType === "full" ? "full" : "bridge",
      sourceCourseSlug: existingPlan.sourceCourseSlug,
      sourceCourseTitle: existingPlan.sourceCourseSlug
        ? getUniversityCourse(existingPlan.sourceCourseSlug)?.course.title ??
          existingPlan.sourceCourseSlug
        : null,
      recognizedCredits: existingPlan.recognizedCredits,
      remainingCredits: existingPlan.remainingCredits,
      priceFen: existingPlan.remainingCredits * CREDIT_PRICE_FEN,
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
    };
  }

  const completedCourses = getAllUniversityCourses()
    .filter(({ course }) => completedSlugs.has(course.slug))
    .map(({ course }) => course);
  const decision = evaluateCourseTransfer(target.course, completedCourses);
  return {
    ...decision,
    targetCourseSlug,
    targetCourseTitle: target.course.title,
    targetCredits: target.course.credits,
    targetRigorLevel: target.course.rigorLevel,
    status: decision.type === "none" ? "unavailable" : "eligible",
    existingPlan,
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

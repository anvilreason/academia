import type { UniversityCourse } from "@/lib/content/university";

export const CREDIT_PRICE_FEN = 2_475;

export type TransferDecision = {
  type: "none" | "full" | "bridge";
  sourceCourseSlug: string | null;
  sourceCourseTitle: string | null;
  recognizedCredits: number;
  remainingCredits: number;
  priceFen: number;
  reason: string;
};

type CompletedCourse = Pick<
  UniversityCourse,
  | "slug"
  | "title"
  | "credits"
  | "identityKey"
  | "rigorLevel"
  | "curriculumVersion"
>;

function compareTransfer(
  target: CompletedCourse,
  source: CompletedCourse,
): TransferDecision {
  if (source.slug === target.slug || source.identityKey !== target.identityKey) {
    return {
      type: "none",
      sourceCourseSlug: null,
      sourceCourseTitle: null,
      recognizedCredits: 0,
      remainingCredits: target.credits,
      priceFen: target.credits * CREDIT_PRICE_FEN,
      reason: "没有可用于互认的已修课程",
    };
  }

  const coversTarget =
    source.rigorLevel >= target.rigorLevel &&
    source.credits >= target.credits &&
    source.curriculumVersion === target.curriculumVersion;
  if (coversTarget) {
    return {
      type: "full",
      sourceCourseSlug: source.slug,
      sourceCourseTitle: source.title,
      recognizedCredits: target.credits,
      remainingCredits: 0,
      priceFen: 0,
      reason:
        source.rigorLevel === target.rigorLevel
          ? "课程内容、难度与学分要求一致，可以直接互认"
          : "已修课程覆盖当前课程的全部要求，可以直接互认",
    };
  }

  const rigorCoverage = Math.min(1, source.rigorLevel / target.rigorLevel);
  const creditCoverage = Math.min(1, source.credits / target.credits);
  const recognizedCredits = Math.max(
    1,
    Math.min(
      target.credits - 1,
      Math.floor(target.credits * rigorCoverage * creditCoverage),
    ),
  );
  const remainingCredits = target.credits - recognizedCredits;
  return {
    type: "bridge",
    sourceCourseSlug: source.slug,
    sourceCourseTitle: source.title,
    recognizedCredits,
    remainingCredits,
    priceFen: remainingCredits * CREDIT_PRICE_FEN,
    reason:
      source.rigorLevel < target.rigorLevel
        ? `课程名称相同，但当前课程要求更高；只需补修 ${remainingCredits} 学分的进阶部分`
        : `已修课程覆盖部分内容；只需补修 ${remainingCredits} 学分的差异部分`,
  };
}

export function evaluateCourseTransfer(
  target: CompletedCourse,
  completedCourses: CompletedCourse[],
): TransferDecision {
  const candidates = completedCourses
    .map((source) => compareTransfer(target, source))
    .filter((decision) => decision.type !== "none")
    .sort((a, b) => {
      if (a.type === "full" && b.type !== "full") return -1;
      if (b.type === "full" && a.type !== "full") return 1;
      return b.recognizedCredits - a.recognizedCredits;
    });
  return (
    candidates[0] ?? {
      type: "none",
      sourceCourseSlug: null,
      sourceCourseTitle: null,
      recognizedCredits: 0,
      remainingCredits: target.credits,
      priceFen: target.credits * CREDIT_PRICE_FEN,
      reason: "这门课程需要完整修习",
    }
  );
}

export function priceForCourseCredits(
  target: CompletedCourse,
  completedCourses: CompletedCourse[],
) {
  return evaluateCourseTransfer(target, completedCourses).priceFen;
}

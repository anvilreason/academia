import {
  KNOWLEDGE_GRAPH_VERSION,
  resultRelationsForCourse,
} from "@/lib/content/result-knowledge-graph";
import { getUniversityCourse } from "@/lib/content/university";
import { getFormalAnswerPath } from "@/lib/domain/answer-path";
import { calculateResultRecognitionCredits } from "@/lib/domain/result-recognition";
import type {
  AcademiaRepository,
  ResultRecognitionRecord,
} from "@/lib/repositories/types";

export type EligibleResultRecognition = {
  enrollmentId: string;
  pathSlug: string;
  pathTitle: string;
  artifactId: string;
  artifactTitle: string;
  artifactVersion: number;
  capabilityId: string;
  capabilityLabel: string;
  courseSlug: string;
  role: string;
  availableCredits: number;
  knowledgeNodeSlugs: string[];
  completedAt: string;
  alreadyRecognized: boolean;
  recognizedCourseSlug: string | null;
};

export async function getCourseResultRecognitionState(
  repository: AcademiaRepository,
  userId: string,
  courseSlug: string,
) {
  const academic = getUniversityCourse(courseSlug);
  if (!academic) return null;
  const relations = resultRelationsForCourse(courseSlug).filter(
    (relation) => relation.course.practiceCredits > 0,
  );
  const [enrollments, recognitions] = await Promise.all([
    repository.listAnswerPathEnrollments(userId),
    repository.listResultRecognitions(userId),
  ]);
  const recognitionByEnrollment = new Map(
    recognitions.map((recognition) => [
      recognition.enrollmentId,
      recognition,
    ]),
  );
  const eligible: EligibleResultRecognition[] = [];
  for (const relation of relations) {
    const enrollment = enrollments.find(
      (item) =>
        item.pathSlug === relation.pathSlug && item.status === "completed",
    );
    if (!enrollment?.completedAt) continue;
    const snapshot = await repository.getAnswerPathSnapshot(
      userId,
      relation.pathSlug,
    );
    const artifact = snapshot?.artifacts.at(-1);
    const evaluation = artifact
      ? snapshot?.evaluations.find(
          (item) =>
            item.artifactId === artifact.id && !item.requiredRevision,
        )
      : null;
    const capability = snapshot?.capabilities.at(-1);
    const config = getFormalAnswerPath(relation.pathSlug);
    if (
      !snapshot?.outcome ||
      !artifact ||
      !evaluation ||
      !capability ||
      !config
    ) {
      continue;
    }
    const existing = recognitionByEnrollment.get(enrollment.id) ?? null;
    eligible.push({
      enrollmentId: enrollment.id,
      pathSlug: relation.pathSlug,
      pathTitle: config.title,
      artifactId: artifact.id,
      artifactTitle: artifact.title,
      artifactVersion: artifact.version,
      capabilityId: capability.capabilityId,
      capabilityLabel: config.capabilityLabel,
      courseSlug,
      role: relation.course.role,
      availableCredits: relation.course.practiceCredits,
      knowledgeNodeSlugs: relation.course.knowledgeNodeSlugs,
      completedAt: enrollment.completedAt,
      alreadyRecognized: Boolean(existing),
      recognizedCourseSlug: existing?.courseSlug ?? null,
    });
  }
  const courseRecognitions = recognitions.filter(
    (item) => item.courseSlug === courseSlug && item.status === "validated",
  );
  const recognizedCredits = Math.min(
    Math.max(0, academic.course.credits - 1),
    courseRecognitions.reduce(
      (sum, recognition) => sum + recognition.recognizedCredits,
      0,
    ),
  );
  return {
    graphVersion: KNOWLEDGE_GRAPH_VERSION,
    course: {
      slug: academic.course.slug,
      title: academic.course.title,
      credits: academic.course.credits,
      availability: academic.course.availability,
    },
    eligible,
    recognitions: courseRecognitions,
    recognizedCredits,
    remainingCredits: academic.course.credits - recognizedCredits,
    rule:
      "只认定审阅通过且已记录现实结果的作品；每门课至少保留 1 学分核心理解与期末检验。",
  };
}

export async function recognizeCompletedPathResult(input: {
  repository: AcademiaRepository;
  userId: string;
  courseSlug: string;
  enrollmentId: string;
}): Promise<ResultRecognitionRecord> {
  const state = await getCourseResultRecognitionState(
    input.repository,
    input.userId,
    input.courseSlug,
  );
  if (!state) throw new Error("COURSE_NOT_FOUND");
  if (state.course.availability !== "open") {
    throw new Error("COURSE_NOT_FORMALLY_OPEN");
  }
  const source = state.eligible.find(
    (item) => item.enrollmentId === input.enrollmentId,
  );
  if (!source) throw new Error("RESULT_NOT_ELIGIBLE");
  if (source.alreadyRecognized) {
    if (source.recognizedCourseSlug === input.courseSlug) {
      const existing = state.recognitions.find(
        (item) => item.enrollmentId === input.enrollmentId,
      );
      if (existing) return existing;
    }
    throw new Error("RESULT_ALREADY_USED");
  }
  const recognizedCredits = calculateResultRecognitionCredits(
    state.course.credits,
    state.recognizedCredits,
    source.availableCredits,
  );
  if (recognizedCredits < 1) throw new Error("NO_RECOGNITION_CAPACITY");
  const academic = getUniversityCourse(input.courseSlug);
  if (!academic) throw new Error("COURSE_NOT_FOUND");
  return input.repository.createResultRecognition({
    userId: input.userId,
    enrollmentId: input.enrollmentId,
    courseSlug: input.courseSlug,
    programSlug: academic.program.slug,
    recognizedCredits,
    graphVersion: KNOWLEDGE_GRAPH_VERSION,
  });
}

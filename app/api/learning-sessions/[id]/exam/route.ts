import { examForNode } from "@/lib/content/exams";
import { getUniversityCourse } from "@/lib/content/university";
import { gradePointForScore } from "@/lib/domain/grading";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

function buildNote(nodeTitle: string, score: number, weakTopics: string[]) {
  return {
    title: `${nodeTitle} · 课程结业笔记`,
    content: `期末考试 ${score} 分，课程已通过并计入正式学分。${
      weakTopics.length
        ? `仍建议回看：${weakTopics.join("、")}。`
        : "本次考核未发现明显薄弱知识点。"
    }\n\n下一步：把一个仍未经验证的判断放进真实工作，并主动寻找反例。`,
  };
}

async function getOwnedExam(request: Request, id: string) {
  const actor = await getActor(request);
  if (!actor.userId) {
    return { error: apiError("UNAUTHORIZED", "建立学籍后才能参加期末考试", 401) };
  }
  const repository = getRepository();
  const session = await repository.getLearningSession(id);
  if (!session || session.userId !== actor.userId) {
    return { error: apiError("NOT_FOUND", "学习会话不存在", 404) };
  }
  const questions = examForNode(session.nodeSlug);
  const academic = getUniversityCourse(session.nodeSlug);
  if (!questions || !academic) {
    return { error: apiError("NOT_FOUND", "这门课程尚未开放考试", 404) };
  }
  if (session.progress < 100) {
    return {
      error: apiError("CONFLICT", "完成课程学习后才能参加期末考试", 409),
    };
  }
  return { actor, repository, session, questions, academic };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getOwnedExam(request, id);
  if ("error" in result) return result.error;
  return apiData({
    course: {
      title: result.academic.course.title,
      credits: result.academic.course.credits,
      passScore: 60,
      maxGradePoint: 4,
    },
    questions: result.questions.map(({ prompt, choices, topic }, index) => ({
      id: index,
      prompt,
      choices,
      topic,
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getOwnedExam(request, id);
  if ("error" in result) return result.error;
  const body = (await request.json()) as { answers?: number[] };
  if (
    !Array.isArray(body.answers) ||
    body.answers.length !== result.questions.length ||
    body.answers.some((answer) => !Number.isInteger(answer))
  ) {
    return apiError("BAD_REQUEST", "请完成全部题目后交卷", 400);
  }
  const correct = result.questions.reduce(
    (sum, question, index) =>
      sum + (body.answers?.[index] === question.correctIndex ? 1 : 0),
    0,
  );
  const score = Math.round((correct / result.questions.length) * 100);
  const gradePoint = gradePointForScore(score);
  const passed = score >= 60;
  const weakTopics = result.questions
    .filter(
      (question, index) => body.answers?.[index] !== question.correctIndex,
    )
    .map((question) => question.topic);
  const creditsEarned = passed ? result.academic.course.credits : 0;
  const attempt = await result.repository.recordExamAttempt({
    userId: result.actor.userId,
    sessionId: result.session.id,
    nodeSlug: result.session.nodeSlug,
    score,
    gradePoint,
    creditsAttempted: result.academic.course.credits,
    creditsEarned,
    passed,
    weakTopics,
  });

  if (!passed) {
    return apiData({
      ...attempt,
      canRetake: true,
      retakeMessage: "已生成薄弱知识点清单。重修后可再次参加考试。",
    });
  }

  const note = await result.repository.completeLearningSession(
    result.session.id,
    result.actor.userId,
    buildNote(result.academic.course.title, score, weakTopics),
  );
  const paidAmount = await result.repository.getPaidOrderAmount(
    result.actor.userId,
    result.session.nodeSlug,
  );
  await result.repository.addCompletedCourseSpend(
    result.actor.userId,
    paidAmount,
    result.session.id,
  );
  return apiData({
    ...attempt,
    note,
    canRetake: true,
    recommendation: {
      slug: "disruptive-innovation",
      title: "创新管理：颠覆式创新",
    },
  });
}

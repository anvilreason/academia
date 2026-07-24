import { getRepository } from "@/lib/repositories";
import {
  answerPathNextStep,
  recommendNextAnswerPath,
} from "@/lib/domain/answer-path";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

export async function GET(request: Request) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先登录", 401);
  const repository = getRepository();
  const [dashboard, answerPathEnrollments] = await Promise.all([
    repository.getDashboard(actor.userId),
    repository.listAnswerPathEnrollments(actor.userId),
  ]);
  const completedPorter = dashboard.sessions.some(
    (session) =>
      session.nodeSlug === "porter-five-forces" &&
      session.status === "completed",
  );
  const answerPath = recommendNextAnswerPath(answerPathEnrollments);
  const answerPathEnrollment = answerPath
    ? answerPathEnrollments.find((item) => item.pathSlug === answerPath.slug) ??
      null
    : null;
  return apiData({
    ...dashboard,
    recommendation: completedPorter
      ? {
          slug: "disruptive-innovation",
          title: "颠覆式创新：好公司为什么仍会失败",
        }
      : null,
    nextAction: answerPath
      ? {
          type: "answer_path",
          slug: answerPath.slug,
          pathTitle: answerPath.title,
          capabilityLabel: answerPath.capabilityLabel,
          ...answerPathNextStep(answerPathEnrollment, answerPath),
        }
      : {
          type: "capabilities",
          slug: null,
          pathTitle: "六条旗舰路径已经完成",
          capabilityLabel: "把能力迁移到新的真实问题",
          label: "查看能力档案",
          title: "选择一个新情境，检验能力能否迁移",
          description: "完成不是终点；只有在新情境中独立应用，能力层级才会继续上升。",
        },
  });
}

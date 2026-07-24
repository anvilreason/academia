import { canCompleteNode } from "@/lib/domain/learning";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";

function buildNote(
  nodeTitle: string,
  answers: string[],
): { title: string; content: string } {
  const evidence = answers
    .slice(-3)
    .map((answer, index) => `${index + 1}. ${answer.slice(0, 180)}`)
    .join("\n");
  return {
    title: `${nodeTitle} · 我的判断`,
    content: `这节课里，我用自己的业务处境检验了理论，而不是只记住定义。\n\n关键证据：\n${evidence}\n\n下一步：选择一个仍然未经验证的假设，在真实工作中收集反例。`,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getActor(request);
  if (!actor.userId) {
    return apiError("UNAUTHORIZED", "注册后才能完成课程并生成笔记", 401);
  }
  const { id } = await params;
  const repository = getRepository();
  const session = await repository.getLearningSession(id);
  if (!session || session.userId !== actor.userId) {
    return apiError("NOT_FOUND", "学习会话不存在", 404);
  }
  if (!canCompleteNode(session.nodeSlug, session.turnCount)) {
    return apiError("CONFLICT", "还需要继续完成当前对话阶段", 409);
  }
  const sessionMessages = await repository.listMessages(id);
  const note = await repository.completeLearningSession(
    id,
    actor.userId,
    buildNote(
      session.nodeSlug === "porter-five-forces"
        ? "Porter 五力"
        : "4P 与 STP",
      sessionMessages
        .filter((message) => message.role === "user")
        .map((message) => message.content),
    ),
  );
  return apiData({
    sessionId: id,
    note,
    recommendation: {
      slug: "disruptive-innovation",
      title: "颠覆式创新：好公司为什么仍会失败",
    },
  });
}

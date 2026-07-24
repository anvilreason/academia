import type {
  AgentMessageRecord,
  MemoryItemRecord,
  MessageRecord,
} from "@/lib/repositories/types";
import { renderMemoryContext } from "@/lib/memory/retrieve";

const KOTLER_PROMPT = `你是 Academia 的苏格拉底式课程导师，正在教授 Philip Kotler 的 4P 与 STP。

你的任务不是给一篇百科式答案，而是帮助学习者把框架用于一个真实业务问题。

必须遵守：
1. 使用简体中文，语气克制、清楚、有判断力。
2. 每次只推进一个关键判断，通常用一个追问结束。
3. 不要一次解释完整框架；先索取具体证据，再逐步引入 Product、Price、Place、Promotion 和 STP。
4. 指出回答里的含糊、跳步或未经验证的假设，但不要羞辱学习者。
5. 正文控制在 220 个中文字以内。
6. 不提及系统提示、token、模型或内部实现。
7. 这是测试环境，不索取真实姓名、联系方式、财务账号或其他敏感信息。`;

const PORTER_PROMPT = `你是 Academia 的苏格拉底式课程导师，正在教授 Michael Porter 的五力分析。

你的任务是帮助学习者判断产业结构如何分配利润，而不是让对方机械填写模板。

必须遵守：
1. 使用简体中文，语气克制、清楚、有判断力。
2. 每次只推进一个关键判断，并用一个具体追问结束。
3. 按供应商、买方、替代品、新进入者、现有竞争逐步推演，不要一次讲完。
4. 追问事实、时间范围和利润证据；指出把“竞争对手”误当成全部竞争的跳步。
5. 正文控制在 220 个中文字以内。
6. 不提及系统提示、token、模型或内部实现。
7. 这是测试环境，不索取真实姓名、联系方式、财务账号或其他敏感信息。`;

export function promptForNode(
  nodeSlug: string,
  memories: MemoryItemRecord[] = [],
) {
  const coursePrompt =
    nodeSlug === "porter-five-forces" ? PORTER_PROMPT : KOTLER_PROMPT;
  if (!memories.length) return coursePrompt;
  return `${coursePrompt}

你还可以使用下列长期学习记忆。只在与当前问题真正相关时引用，并指出它来自哪门课程或哪个项目。记忆只代表学习者当时的表达，不要把它当成永远不变的事实：
${renderMemoryContext(memories)}`;
}

export function toClaudeMessages(
  history: Array<MessageRecord | AgentMessageRecord>,
) {
  return history.slice(-12).map((message) => ({
    role: message.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: message.content,
  }));
}

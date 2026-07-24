import type {
  AgentMessageRecord,
  MemoryItemRecord,
  MessageRecord,
} from "@/lib/repositories/types";
import { runtimeEnv } from "@/lib/server/env";
import {
  estimateCostFen,
  estimateTokens,
  MAX_OUTPUT_TOKENS,
  reserveBudget,
  settleBudget,
} from "./cost-tracker";
import { tokenPriceFor } from "./pricing";
import { academiaAgentPrompt } from "./prompts/academia-agent-zh-v1";
import { promptForNode } from "./prompts/socratic-zh-v1";
import { streamAnthropic } from "./providers/anthropic";
import { streamKimi } from "./providers/kimi";
import { streamOpenAi } from "./providers/openai";
import type { LlmMessage } from "./providers/types";
import {
  LlmBudgetError,
  LlmProviderError,
} from "./router-errors";

export { LlmBudgetError, LlmProviderError } from "./router-errors";

export type LlmUsage = { inputTokens: number; outputTokens: number };
export type LlmMode =
  | { type: "course"; nodeSlug: string }
  | { type: "general-agent" };

type StreamCallbacks = {
  onDelta(text: string): Promise<void>;
  onReserved?(input: {
    providerModel: string;
    dateKey: string;
    reservedFen: number;
  }): Promise<void>;
};

function kimiReasoningEffort(
  value?: string,
): "low" | "high" | "max" {
  return value === "low" || value === "max" ? value : "high";
}

function providerConfig() {
  const config = runtimeEnv();
  const requested = config.LLM_PROVIDER?.toLowerCase();
  if (requested === "kimi") {
    if (!config.MOONSHOT_API_KEY) {
      throw new LlmProviderError("MOONSHOT_API_KEY is unavailable");
    }
    return {
      provider: "kimi" as const,
      apiKey: config.MOONSHOT_API_KEY,
      model: config.KIMI_MODEL || "kimi-k3",
      reasoningEffort: kimiReasoningEffort(
        config.KIMI_REASONING_EFFORT,
      ),
    };
  }
  if (requested === "openai") {
    if (!config.OPENAI_API_KEY) {
      throw new LlmProviderError("OPENAI_API_KEY is unavailable");
    }
    return {
      provider: "openai" as const,
      apiKey: config.OPENAI_API_KEY,
      model: config.OPENAI_MODEL || "gpt-5.6-sol",
    };
  }
  if (requested === "anthropic") {
    if (!config.ANTHROPIC_API_KEY) {
      throw new LlmProviderError("ANTHROPIC_API_KEY is unavailable");
    }
    return {
      provider: "anthropic" as const,
      apiKey: config.ANTHROPIC_API_KEY,
      model: config.ANTHROPIC_MODEL || "claude-sonnet-5",
    };
  }
  if (config.OPENAI_API_KEY) {
    return {
      provider: "openai" as const,
      apiKey: config.OPENAI_API_KEY,
      model: config.OPENAI_MODEL || "gpt-5.6-sol",
    };
  }
  if (config.MOONSHOT_API_KEY) {
    return {
      provider: "kimi" as const,
      apiKey: config.MOONSHOT_API_KEY,
      model: config.KIMI_MODEL || "kimi-k3",
      reasoningEffort: kimiReasoningEffort(
        config.KIMI_REASONING_EFFORT,
      ),
    };
  }
  if (config.ANTHROPIC_API_KEY) {
    return {
      provider: "anthropic" as const,
      apiKey: config.ANTHROPIC_API_KEY,
      model: config.ANTHROPIC_MODEL || "claude-sonnet-5",
    };
  }
  throw new LlmProviderError("No LLM provider is configured");
}

export async function streamAcadPro(input: {
  history: Array<MessageRecord | AgentMessageRecord>;
  mode: LlmMode;
  memories?: MemoryItemRecord[];
  callbacks: StreamCallbacks;
}) {
  const provider = providerConfig();
  const memories = input.memories ?? [];
  const systemPrompt =
    input.mode.type === "general-agent"
      ? academiaAgentPrompt(memories)
      : promptForNode(input.mode.nodeSlug, memories);
  const estimatedInput = estimateTokens(
    systemPrompt +
      input.history.map((message) => message.content).join("\n"),
  );
  const tokenPrice = tokenPriceFor(provider.provider, provider.model);
  const usdCnyRate = Number(runtimeEnv().USD_CNY_RATE || 7.2);
  const reservation = await reserveBudget(estimatedInput, {
    tokenPrice,
    usdCnyRate,
  });
  if (!reservation) throw new LlmBudgetError("daily budget exhausted");
  const providerModel = `${provider.provider}:${provider.model}`;
  await input.callbacks.onReserved?.({ providerModel, ...reservation });

  let succeeded = false;
  try {
    const providerInput = {
      apiKey: provider.apiKey,
      model: provider.model,
      systemPrompt,
      history: input.history satisfies LlmMessage[],
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      reasoningEffort:
        "reasoningEffort" in provider
          ? provider.reasoningEffort
          : undefined,
      onDelta: input.callbacks.onDelta,
    };
    const streamed =
      provider.provider === "openai"
        ? await streamOpenAi(providerInput)
        : provider.provider === "kimi"
          ? await streamKimi(providerInput)
          : await streamAnthropic(providerInput);
    const inputTokens = streamed.inputTokens || estimatedInput;
    const outputTokens =
      streamed.outputTokens || estimateTokens(streamed.text);
    const actualFen = estimateCostFen(
      inputTokens,
      outputTokens,
      usdCnyRate,
      tokenPrice,
    );
    await settleBudget(
      reservation.dateKey,
      reservation.reservedFen,
      actualFen,
    );
    succeeded = true;
    return {
      text: streamed.text,
      providerModel,
      usage: { inputTokens, outputTokens } satisfies LlmUsage,
      actualFen,
      reservation,
    };
  } finally {
    if (!succeeded) {
      await settleBudget(reservation.dateKey, reservation.reservedFen, 0);
    }
  }
}

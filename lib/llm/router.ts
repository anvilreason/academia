import type { MessageRecord } from "@/lib/repositories/types";
import { runtimeEnv } from "@/lib/server/env";
import {
  estimateCostFen,
  estimateTokens,
  MAX_OUTPUT_TOKENS,
  reserveBudget,
  settleBudget,
} from "./cost-tracker";
import { promptForNode, toClaudeMessages } from "./prompts/socratic-zh-v1";

export type LlmUsage = { inputTokens: number; outputTokens: number };

type StreamCallbacks = {
  onDelta(text: string): Promise<void>;
  onReserved?(input: {
    providerModel: string;
    dateKey: string;
    reservedFen: number;
  }): Promise<void>;
};

export class LlmBudgetError extends Error {}
export class LlmProviderError extends Error {}

export async function streamAcadPro(
  history: MessageRecord[],
  nodeSlug: string,
  callbacks: StreamCallbacks,
) {
  const config = runtimeEnv();
  if (!config.ANTHROPIC_API_KEY) {
    throw new LlmProviderError("ANTHROPIC_API_KEY is unavailable");
  }
  const systemPrompt = promptForNode(nodeSlug);
  const providerModel = config.ANTHROPIC_MODEL || "claude-sonnet-5";
  const estimatedInput = estimateTokens(
    systemPrompt + history.map((message) => message.content).join("\n"),
  );
  const reservation = await reserveBudget(estimatedInput);
  if (!reservation) throw new LlmBudgetError("daily budget exhausted");
  await callbacks.onReserved?.({ providerModel, ...reservation });

  let inputTokens = estimatedInput;
  let outputTokens = 0;
  let fullText = "";
  let succeeded = false;
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": config.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: providerModel,
        max_tokens: MAX_OUTPUT_TOKENS,
        stream: true,
        thinking: { type: "disabled" },
        system: systemPrompt,
        messages: toClaudeMessages(history),
      }),
    });
    if (!response.ok || !response.body) {
      const detail = await response.text();
      throw new LlmProviderError(
        `Anthropic ${response.status}: ${detail.slice(0, 240)}`,
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        const dataLine = frame
          .split("\n")
          .find((line) => line.startsWith("data:"));
        if (!dataLine) continue;
        const event = JSON.parse(dataLine.slice(5).trim()) as {
          type: string;
          message?: { usage?: { input_tokens?: number } };
          delta?: {
            type?: string;
            text?: string;
            usage?: { output_tokens?: number };
          };
          usage?: { output_tokens?: number };
          error?: { message?: string };
        };
        if (event.type === "message_start") {
          inputTokens = event.message?.usage?.input_tokens ?? inputTokens;
        } else if (
          event.type === "content_block_delta" &&
          event.delta?.type === "text_delta" &&
          event.delta.text
        ) {
          fullText += event.delta.text;
          await callbacks.onDelta(event.delta.text);
        } else if (event.type === "message_delta") {
          outputTokens =
            event.usage?.output_tokens ??
            event.delta?.usage?.output_tokens ??
            outputTokens;
        } else if (event.type === "error") {
          throw new LlmProviderError(
            event.error?.message ?? "Anthropic stream error",
          );
        }
      }
      if (done) break;
    }
    const actualFen = estimateCostFen(inputTokens, outputTokens);
    await settleBudget(
      reservation.dateKey,
      reservation.reservedFen,
      actualFen,
    );
    succeeded = true;
    return {
      text: fullText.trim(),
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

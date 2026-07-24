import { LlmProviderError } from "../router-errors";
import type {
  ProviderStreamInput,
  ProviderStreamResult,
} from "./types";

export async function streamAnthropic(
  input: ProviderStreamInput,
): Promise<ProviderStreamResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": input.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: input.maxOutputTokens,
      stream: true,
      thinking: { type: "disabled" },
      system: input.systemPrompt,
      messages: input.history.slice(-16).map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      })),
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
  let text = "";
  let inputTokens = 0;
  let outputTokens = 0;
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
        text += event.delta.text;
        await input.onDelta(event.delta.text);
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
  return { text: text.trim(), inputTokens, outputTokens };
}

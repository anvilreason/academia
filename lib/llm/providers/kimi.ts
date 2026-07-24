import { LlmProviderError } from "../router-errors";
import type {
  ProviderStreamInput,
  ProviderStreamResult,
} from "./types";

type KimiChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
      reasoning_content?: string;
    };
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  error?: {
    message?: string;
  };
};

export async function streamKimi(
  input: ProviderStreamInput,
): Promise<ProviderStreamResult> {
  const response = await fetch(
    "https://api.moonshot.cn/v1/chat/completions",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${input.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: input.model,
        stream: true,
        stream_options: { include_usage: true },
        max_completion_tokens: input.maxOutputTokens,
        reasoning_effort: input.reasoningEffort ?? "high",
        messages: [
          { role: "system", content: input.systemPrompt },
          ...input.history.slice(-16).map((message) => ({
            role: message.role === "assistant" ? "assistant" : "user",
            content: message.content,
          })),
        ],
      }),
    },
  );
  if (!response.ok || !response.body) {
    const detail = await response.text();
    throw new LlmProviderError(
      `Kimi ${response.status}: ${detail.slice(0, 240)}`,
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
    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const dataLine = frame
        .split(/\r?\n/)
        .find((line) => line.startsWith("data:"));
      if (!dataLine) continue;
      const raw = dataLine.slice(5).trim();
      if (raw === "[DONE]") continue;
      const chunk = JSON.parse(raw) as KimiChunk;
      if (chunk.error?.message) {
        throw new LlmProviderError(chunk.error.message);
      }
      const choice = chunk.choices?.[0];
      const delta = choice?.delta?.content;
      if (delta) {
        text += delta;
        await input.onDelta(delta);
      }
      const usage = choice?.usage ?? chunk.usage;
      inputTokens = usage?.prompt_tokens ?? inputTokens;
      outputTokens = usage?.completion_tokens ?? outputTokens;
    }
    if (done) break;
  }

  return { text: text.trim(), inputTokens, outputTokens };
}

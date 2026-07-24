import { LlmProviderError } from "../router-errors";
import type {
  ProviderStreamInput,
  ProviderStreamResult,
} from "./types";

export async function streamOpenAi(
  input: ProviderStreamInput,
): Promise<ProviderStreamResult> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      stream: true,
      store: false,
      max_output_tokens: input.maxOutputTokens,
      reasoning: { effort: "low" },
      text: { verbosity: "medium" },
      instructions: input.systemPrompt,
      input: input.history.slice(-16).map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      })),
    }),
  });
  if (!response.ok || !response.body) {
    const detail = await response.text();
    throw new LlmProviderError(
      `OpenAI ${response.status}: ${detail.slice(0, 240)}`,
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
      if (!dataLine || dataLine.endsWith("[DONE]")) continue;
      const event = JSON.parse(dataLine.slice(5).trim()) as {
        type: string;
        delta?: string;
        message?: string;
        response?: {
          error?: { message?: string };
          usage?: { input_tokens?: number; output_tokens?: number };
        };
      };
      if (event.type === "response.output_text.delta" && event.delta) {
        text += event.delta;
        await input.onDelta(event.delta);
      } else if (event.type === "response.completed") {
        inputTokens =
          event.response?.usage?.input_tokens ?? inputTokens;
        outputTokens =
          event.response?.usage?.output_tokens ?? outputTokens;
      } else if (
        event.type === "response.failed" ||
        event.type === "error"
      ) {
        throw new LlmProviderError(
          event.response?.error?.message ??
            event.message ??
            "OpenAI stream error",
        );
      }
    }
    if (done) break;
  }
  return { text: text.trim(), inputTokens, outputTokens };
}

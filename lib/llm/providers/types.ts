import type {
  AgentMessageRecord,
  MessageRecord,
} from "@/lib/repositories/types";

export type LlmMessage = Pick<
  MessageRecord | AgentMessageRecord,
  "role" | "content"
>;

export type ProviderStreamInput = {
  apiKey: string;
  model: string;
  systemPrompt: string;
  history: LlmMessage[];
  maxOutputTokens: number;
  onDelta(text: string): Promise<void>;
};

export type ProviderStreamResult = {
  text: string;
  inputTokens: number;
  outputTokens: number;
};

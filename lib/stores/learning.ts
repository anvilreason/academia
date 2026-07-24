import { create } from "zustand";

export type LearningMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type LearningState = {
  messages: LearningMessage[];
  draft: string;
  progress: number;
  turnCount: number;
  streaming: boolean;
  registrationRequired: boolean;
  error: string | null;
  hydrate(input: {
    messages: LearningMessage[];
    progress: number;
    turnCount: number;
  }): void;
  setDraft(value: string): void;
  addUser(message: LearningMessage): void;
  startAssistant(id: string): void;
  appendDelta(id: string, text: string): void;
  setProgress(progress: number, turnCount: number): void;
  setStreaming(value: boolean): void;
  requireRegistration(): void;
  setError(value: string | null): void;
};

export const useLearningStore = create<LearningState>((set) => ({
  messages: [],
  draft: "",
  progress: 0,
  turnCount: 0,
  streaming: false,
  registrationRequired: false,
  error: null,
  hydrate: (input) => set(input),
  setDraft: (draft) => set({ draft }),
  addUser: (message) =>
    set((state) => ({ messages: [...state.messages, message], draft: "" })),
  startAssistant: (id) =>
    set((state) => ({
      messages: [...state.messages, { id, role: "assistant", content: "" }],
    })),
  appendDelta: (id, text) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id
          ? { ...message, content: message.content + text }
          : message,
      ),
    })),
  setProgress: (progress, turnCount) => set({ progress, turnCount }),
  setStreaming: (streaming) => set({ streaming }),
  requireRegistration: () => set({ registrationRequired: true }),
  setError: (error) => set({ error }),
}));

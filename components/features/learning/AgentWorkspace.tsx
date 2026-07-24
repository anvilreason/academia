"use client";

import { FormEvent, useState } from "react";

type Message = {
  role: "assistant" | "user";
  content: string;
};

const opening: Message[] = [
  {
    role: "assistant",
    content:
      "在我们进 4P 之前，先说说你最近正在做的项目。哪怕一句话。我想知道你是从什么具体处境读这一节的。",
  },
];

const previewReplies = [
  "好。先别急着解释全部背景——如果只能选一个，你直觉上认为卡住的是 Product、Price、Place 还是 Promotion？",
  "你选择了它，说明你已经有一个隐含判断。现在给我一个最近两周发生的具体证据，别给结论。",
];

export function AgentWorkspace() {
  const [messages, setMessages] = useState<Message[]>(opening);
  const [draft, setDraft] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    const reply =
      previewReplies[Math.min(messages.filter((m) => m.role === "user").length, 1)];
    setMessages((current) => [
      ...current,
      { role: "user", content: value },
      { role: "assistant", content: reply },
    ]);
    setDraft("");
  }

  return (
    <>
      <section className="conversation" aria-live="polite">
        <div className="conversation-intro">
          <p className="eyebrow">免费试听 · 第 1 节</p>
          <h1>4P 与 STP：增长究竟卡在哪里</h1>
          <p>Philip Kotler · Kellogg · 你的回答会决定对话往哪里走</p>
        </div>
        {messages.map((message, index) =>
          message.role === "assistant" ? (
            <article className="chat-message" key={`${message.role}-${index}`}>
              <span className="chat-avatar" aria-hidden="true">
                A
              </span>
              <div className="chat-copy">
                <p>{message.content}</p>
              </div>
            </article>
          ) : (
            <article
              className="chat-message user"
              key={`${message.role}-${index}`}
            >
              {message.content}
            </article>
          ),
        )}
      </section>
      <div className="composer-wrap">
        <form className="composer" onSubmit={submit}>
          <textarea
            aria-label="回答导师"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="想清楚再答，Academia 不会催你"
            rows={1}
            value={draft}
          />
          <button aria-label="发送回答" type="submit">
            ↑
          </button>
        </form>
        <div className="composer-hint">
          v0.2 交互预览 · 下一版本将连接真实 AI 导师
        </div>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUp,
  Brain,
  MessageCircleMore,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type {
  AgentMessageRecord,
  AgentThreadRecord,
  MemoryItemRecord,
} from "@/lib/repositories/types";

type ThreadDetail = AgentThreadRecord & { messages: AgentMessageRecord[] };
type UiMessage = Pick<AgentMessageRecord, "id" | "role" | "content">;

function parseSseFrame(frame: string) {
  const name = frame
    .split("\n")
    .find((line) => line.startsWith("event:"))
    ?.slice(6)
    .trim();
  const data = frame
    .split("\n")
    .find((line) => line.startsWith("data:"))
    ?.slice(5)
    .trim();
  if (!name || !data) return null;
  return { name, data: JSON.parse(data) as Record<string, unknown> };
}

export function GeneralAgentWorkspace() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<UiMessage[] | null>(
    null,
  );
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memoryContexts, setMemoryContexts] = useState<string[]>([]);
  const [memoryOpen, setMemoryOpen] = useState(false);

  const threads = useQuery({
    queryKey: ["agent-threads"],
    enabled: Boolean(session?.user),
    queryFn: async () => {
      const response = await fetch("/api/agent/threads");
      if (!response.ok) throw new Error("暂时无法读取对话");
      const payload = (await response.json()) as {
        data: AgentThreadRecord[];
      };
      return payload.data;
    },
  });

  const effectiveThreadId = threadId ?? threads.data?.[0]?.id ?? null;

  const thread = useQuery({
    queryKey: ["agent-thread", effectiveThreadId],
    enabled: Boolean(effectiveThreadId),
    queryFn: async () => {
      const response = await fetch(
        `/api/agent/threads/${effectiveThreadId}`,
      );
      if (!response.ok) throw new Error("暂时无法打开这段对话");
      const payload = (await response.json()) as { data: ThreadDetail };
      return payload.data;
    },
  });

  const memories = useQuery({
    queryKey: ["agent-memories"],
    enabled: Boolean(session?.user && memoryOpen),
    queryFn: async () => {
      const response = await fetch("/api/me/memories");
      if (!response.ok) throw new Error("暂时无法读取长期记忆");
      const payload = (await response.json()) as {
        data: MemoryItemRecord[];
      };
      return payload.data;
    },
  });

  async function forgetMemory(id: string) {
    const response = await fetch(`/api/me/memories/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setError("暂时无法移除这段记忆");
      return;
    }
    queryClient.setQueryData<MemoryItemRecord[]>(
      ["agent-memories"],
      (current = []) => current.filter((item) => item.id !== id),
    );
  }

  const messages = localMessages ?? thread.data?.messages ?? [];
  const activeTitle =
    threads.data?.find((item) => item.id === effectiveThreadId)?.title ??
    "新的思考";

  async function createThread(firstMessage?: string) {
    const response = await fetch("/api/agent/threads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: firstMessage?.slice(0, 32) || "新的思考",
      }),
    });
    if (!response.ok) throw new Error("暂时无法开始新对话");
    const payload = (await response.json()) as { data: AgentThreadRecord };
    queryClient.setQueryData<AgentThreadRecord[]>(
      ["agent-threads"],
      (current = []) => [payload.data, ...current],
    );
    setThreadId(payload.data.id);
    setLocalMessages([]);
    setMemoryContexts([]);
    return payload.data.id;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || streaming) return;
    setStreaming(true);
    setError(null);
    setDraft("");
    try {
      const targetThreadId =
        effectiveThreadId ?? (await createThread(content));
      const idempotencyKey = crypto.randomUUID();
      const assistantId = `stream-${idempotencyKey}`;
      setLocalMessages((current) => [
        ...(current ?? thread.data?.messages ?? []),
        { id: `user-${idempotencyKey}`, role: "user", content },
        { id: assistantId, role: "assistant", content: "" },
      ]);
      const response = await fetch(
        `/api/agent/threads/${targetThreadId}/messages`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content, idempotencyKey }),
        },
      );
      if (!response.body) throw new Error("Agent 暂时没有回应");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const parsed = parseSseFrame(frame);
          if (!parsed) continue;
          if (parsed.name === "meta") {
            const contexts = parsed.data.memoryContexts;
            if (Array.isArray(contexts)) {
              setMemoryContexts(contexts.map(String));
            }
          } else if (parsed.name === "delta") {
            setLocalMessages((current) =>
              (current ?? thread.data?.messages ?? []).map((message) =>
                message.id === assistantId
                  ? {
                      ...message,
                      content:
                        message.content + String(parsed.data.text ?? ""),
                    }
                  : message,
              ),
            );
          } else if (parsed.name === "error") {
            throw new Error(
              String(parsed.data.message ?? "Agent 暂时没有回应"),
            );
          }
        }
        if (done) break;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["agent-threads"] }),
        queryClient.invalidateQueries({
          queryKey: ["agent-thread", targetThreadId],
        }),
      ]);
      setLocalMessages(null);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Agent 暂时没有回应",
      );
    } finally {
      setStreaming(false);
    }
  }

  if (status === "loading") {
    return <div className="workspace-state">正在打开长期 Agent…</div>;
  }

  if (!session?.user) {
    return (
      <section className="agent-signin">
        <Brain aria-hidden="true" />
        <h1>让每一门课都认识同一个你。</h1>
        <p>
          长期 Agent 会连接你在不同课程和实践项目中留下的判断。记忆只属于你的学籍账户。
        </p>
        <Link className="button button-dark" href="/login?mode=register&continue=/agent">
          建立学籍后开始
        </Link>
      </section>
    );
  }

  return (
    <div className="general-agent">
      <aside className="agent-thread-rail">
        <div>
          <span>对话</span>
          <button
            aria-label="新建对话"
            onClick={() => void createThread()}
            type="button"
          >
            <Plus aria-hidden="true" size={15} />
          </button>
        </div>
        {threads.data?.map((item) => (
          <button
            className={item.id === effectiveThreadId ? "active" : ""}
            key={item.id}
            onClick={() => {
              setThreadId(item.id);
              setLocalMessages(null);
              setMemoryContexts([]);
            }}
            type="button"
          >
            <MessageCircleMore aria-hidden="true" size={15} />
            <span>{item.title}</span>
          </button>
        ))}
      </aside>

      <section className="agent-conversation">
        <header className="agent-conversation-header">
          <div>
            <p className="eyebrow">ACADEMIA PERSONAL AGENT</p>
            <h1>{activeTitle}</h1>
          </div>
          <button
            className="agent-memory-status"
            onClick={() => setMemoryOpen(true)}
            type="button"
          >
            <Brain aria-hidden="true" size={15} />
            {memoryContexts.length
              ? `正在联系 ${memoryContexts.length} 段既往学习`
              : "长期记忆已开启"}
          </button>
        </header>

        <div className="agent-message-list" aria-live="polite">
          {!messages.length && (
            <div className="agent-empty">
              <Sparkles aria-hidden="true" size={20} />
              <h2>从任何仍在困扰你的问题开始。</h2>
              <p>
                你可以谈一门课、一个项目或刚刚形成的想法。相关时，我会把它与你过去留下的内容连接起来。
              </p>
              <div>
                <button
                  onClick={() =>
                    setDraft("我最近在哪些问题上反复犹豫？")
                  }
                  type="button"
                >
                  找出反复出现的问题
                </button>
                <button
                  onClick={() =>
                    setDraft("把我最近的学习和实践项目连接起来。")
                  }
                  type="button"
                >
                  连接学习与项目
                </button>
              </div>
            </div>
          )}
          {messages.map((message) =>
            message.role === "assistant" ? (
              <article className="agent-message assistant" key={message.id}>
                <span>A</span>
                <p>
                  {message.content ||
                    (streaming ? "正在继续思考…" : "这次回答没有完成")}
                </p>
              </article>
            ) : (
              <article className="agent-message user" key={message.id}>
                <p>{message.content}</p>
              </article>
            ),
          )}
        </div>

        <div className="agent-composer-area">
          {memoryContexts.length > 0 && (
            <div className="memory-contexts">
              <Brain aria-hidden="true" size={13} />
              {memoryContexts.map((context) => (
                <span key={context}>{context}</span>
              ))}
            </div>
          )}
          {error && <div className="composer-error">{error}</div>}
          <form className="agent-general-composer" onSubmit={submit}>
            <textarea
              aria-label="与 Academia Agent 对话"
              disabled={streaming}
              maxLength={4000}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                if (
                  event.key !== "Enter" ||
                  event.shiftKey ||
                  event.nativeEvent.isComposing
                ) {
                  return;
                }
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }}
              placeholder="写下问题、判断，或者一个还没有想清楚的念头…"
              rows={2}
              value={draft}
            />
            <button
              aria-label="发送"
              disabled={streaming || !draft.trim()}
              title="发送（Enter）"
              type="submit"
            >
              {streaming ? "…" : <ArrowUp aria-hidden="true" size={18} />}
            </button>
          </form>
          <p>
            Enter 发送 · Shift + Enter 换行 · 长期记忆只来自你的课程、项目和对话
          </p>
        </div>
      </section>
      {memoryOpen && (
        <div
          className="memory-drawer-backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setMemoryOpen(false);
          }}
        >
          <aside className="memory-drawer" aria-label="长期记忆">
            <header>
              <div>
                <p className="eyebrow">LONG-TERM MEMORY</p>
                <h2>Agent 记得的内容</h2>
              </div>
              <button
                aria-label="关闭长期记忆"
                onClick={() => setMemoryOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </header>
            <p className="memory-drawer-intro">
              这里只保存你在课程、项目和对话中真实写下的内容。移除后，Agent
              不会再把它作为长期上下文。
            </p>
            <div className="memory-list">
              {memories.isLoading && <p>正在读取记忆…</p>}
              {memories.data?.map((memory) => (
                <article key={memory.id}>
                  <div>
                    <span>{memory.contextLabel}</span>
                    <time>
                      {new Intl.DateTimeFormat("zh-CN", {
                        month: "short",
                        day: "numeric",
                      }).format(new Date(memory.createdAt))}
                    </time>
                  </div>
                  <p>{memory.content}</p>
                  <button
                    aria-label={`移除记忆：${memory.contextLabel}`}
                    onClick={() => void forgetMemory(memory.id)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={14} />
                    不再记住
                  </button>
                </article>
              ))}
              {memories.data?.length === 0 && (
                <p>还没有长期记忆。完成一次课程对话或建立实践项目后，它会出现在这里。</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

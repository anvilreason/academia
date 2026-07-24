"use client";

import { FormEvent, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp } from "lucide-react";
import {
  type LearningMessage,
  useLearningStore,
} from "@/lib/stores/learning";
import { FinalExam } from "./FinalExam";

type SessionPayload = {
  id: string;
  progress: number;
  turnCount: number;
  messages: Array<{ id: string; role: string; content: string }>;
};

async function readJson(response: Response) {
  const payload = (await response.json()) as {
    data?: SessionPayload;
    error?: { message?: string };
  };
  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message || "课堂暂时无法进入");
  }
  return payload.data;
}

async function getOrCreateSession(nodeSlug: string) {
  const storageKey = `academia-session-${nodeSlug}`;
  const stored = window.localStorage.getItem(storageKey);
  if (stored) {
    const response = await fetch(`/api/learning-sessions/${stored}`);
    if (response.ok) return readJson(response);
    window.localStorage.removeItem(storageKey);
  }
  const response = await fetch("/api/learning-sessions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nodeSlug }),
  });
  const session = await readJson(response);
  window.localStorage.setItem(storageKey, session.id);
  return session;
}

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

export function AgentWorkspace({
  nodeSlug,
  title,
  professor,
  school,
}: {
  nodeSlug: string;
  title: string;
  professor: string;
  school: string;
}) {
  const {
    messages,
    draft,
    progress,
    turnCount,
    streaming,
    registrationRequired,
    error,
    hydrate,
    setDraft,
    addUser,
    startAssistant,
    appendDelta,
    setProgress,
    setStreaming,
    requireRegistration,
    setError,
  } = useLearningStore();
  const sessionQuery = useQuery({
    queryKey: ["learning-session", nodeSlug],
    queryFn: () => getOrCreateSession(nodeSlug),
  });

  useEffect(() => {
    if (!sessionQuery.data) return;
    hydrate({
      messages: sessionQuery.data.messages.map(
        (message) =>
          ({
            id: message.id,
            role: message.role === "user" ? "user" : "assistant",
            content: message.content,
          }) satisfies LearningMessage,
      ),
      progress: sessionQuery.data.progress,
      turnCount: sessionQuery.data.turnCount,
    });
  }, [hydrate, sessionQuery.data]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    const sessionId = sessionQuery.data?.id;
    if (!value || !sessionId || streaming || registrationRequired) return;

    const idempotencyKey = crypto.randomUUID();
    const assistantId = `stream-${idempotencyKey}`;
    addUser({ id: `user-${idempotencyKey}`, role: "user", content: value });
    startAssistant(assistantId);
    setStreaming(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/learning-sessions/${sessionId}/messages`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: value, idempotencyKey }),
        },
      );
      if (!response.body) throw new Error("导师暂时没有回应");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value: chunk } = await reader.read();
        buffer += decoder.decode(chunk, { stream: !done });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const parsed = parseSseFrame(frame);
          if (!parsed) continue;
          if (parsed.name === "delta") {
            appendDelta(assistantId, String(parsed.data.text ?? ""));
          } else if (parsed.name === "progress") {
            setProgress(
              Number(parsed.data.progress ?? progress),
              Number(parsed.data.turnCount ?? turnCount),
            );
            if (parsed.data.registrationRequired) requireRegistration();
          } else if (parsed.name === "error") {
            if (parsed.data.code === "REGISTRATION_REQUIRED") {
              requireRegistration();
            }
            throw new Error(String(parsed.data.message ?? "导师暂时没有回应"));
          }
        }
        if (done) break;
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "导师暂时没有回应");
    } finally {
      setStreaming(false);
    }
  }

  if (sessionQuery.isPending) {
    return (
      <div className="workspace-state" role="status">
        <span className="thinking-dot" />
        正在打开课堂…
      </div>
    );
  }

  if (sessionQuery.isError) {
    return (
      <div className="workspace-state error-state">
        <strong>课堂暂时没有打开</strong>
        <p>{sessionQuery.error.message}</p>
        <div className="state-actions">
          <Link className="button button-accent" href="/login">
            进入学籍入口
          </Link>
          {nodeSlug !== "4p-stp" && (
            <Link className="button button-dark" href={`/courses/${nodeSlug}`}>
              返回课程详情
            </Link>
          )}
        </div>
        <button
          className="text-link retry-link"
          onClick={() => sessionQuery.refetch()}
          type="button"
        >
          再试一次
        </button>
      </div>
    );
  }

  return (
    <>
      <section className="conversation" aria-live="polite">
        <div className="conversation-intro">
          <p className="eyebrow">
            {nodeSlug === "4p-stp" ? "开放旁听" : "专业研修"} · 第一讲
          </p>
          <h1>{title}</h1>
          <p>
            {professor} · {school} · 已进行 {turnCount}/
            {nodeSlug === "porter-five-forces" ? 4 : 5} 轮 · {progress}%
          </p>
        </div>
        {messages.map((message) =>
          message.role === "assistant" ? (
            <article className="chat-message" key={message.id}>
              <span className="chat-avatar" aria-hidden="true">
                A
              </span>
              <div className="chat-copy">
                <p>
                  {message.content ||
                    (streaming ? "正在思考…" : "导师暂时没有完成这次回答")}
                </p>
              </div>
            </article>
          ) : (
            <article className="chat-message user" key={message.id}>
              {message.content}
            </article>
          ),
        )}
        {registrationRequired && (
          <aside className="registration-wall">
            <span className="test-badge">旁听段落告一段落</span>
            <h2>让这段思考留在你的学籍里</h2>
            <p>
              建立学籍后，刚才的回答会原样保留。下次回来，可以从这个问题继续。
            </p>
            <Link
              className="button button-accent"
              href="/login?mode=register&continue=%2Flearn%2F4p-stp"
            >
              建立学籍并继续 →
            </Link>
          </aside>
        )}
        {!registrationRequired &&
          progress >= 100 &&
          sessionQuery.data?.id && (
            <FinalExam
              nodeSlug={nodeSlug}
              sessionId={sessionQuery.data.id}
            />
          )}
      </section>
      <div className="composer-wrap">
        {error && <div className="composer-error">{error}</div>}
        <form className="composer" onSubmit={submit}>
          <textarea
            aria-label="回答导师"
            disabled={streaming || registrationRequired}
            maxLength={2000}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              registrationRequired
                ? "建立学籍后继续这段对话"
                : "想清楚再答，Academia 不会催你"
            }
            rows={1}
            value={draft}
          />
          <button
            aria-label="发送回答"
            disabled={
              streaming || registrationRequired || !draft.trim()
            }
            type="submit"
          >
            {streaming ? "…" : <ArrowUp aria-hidden="true" size={18} />}
          </button>
        </form>
        <div className="composer-hint">
          Academia 对话课堂 · 单条最多 2,000 字 · 允许停顿，也允许改变答案
        </div>
      </div>
    </>
  );
}

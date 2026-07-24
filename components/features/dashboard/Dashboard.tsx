"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

type DashboardData = {
  sessions: Array<{
    id: string;
    nodeSlug: string;
    status: string;
    progress: number;
  }>;
  notes: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  entitlements: string[];
  recommendation: null | { slug: string; title: string };
};

async function loadDashboard() {
  const response = await fetch("/api/me/dashboard");
  const payload = (await response.json()) as {
    data?: DashboardData;
    error?: { message?: string };
  };
  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message || "暂时无法读取学习记录");
  }
  return payload.data;
}

function shortNodeTitle(slug: string) {
  if (slug === "porter-five-forces") return "Porter 五力";
  if (slug === "disruptive-innovation") return "颠覆式创新";
  return "4P 与 STP";
}

export function Dashboard() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: loadDashboard,
  });

  if (query.isPending) {
    return <div className="empty-state">正在整理你的学习记录…</div>;
  }
  if (query.isError) {
    return (
      <div className="empty-state">
        <p>{query.error.message}</p>
        <Link className="button button-accent" href="/login">
          登录或创建账户
        </Link>
      </div>
    );
  }

  const { sessions, notes, recommendation } = query.data;
  return (
    <div className="dashboard-grid">
      <section className="dashboard-primary">
        <span className="section-kicker">最近学习</span>
        {sessions.length ? (
          sessions.slice(0, 3).map((session) => (
            <Link
              className="session-card"
              href={`/learn/${session.nodeSlug}`}
              key={session.id}
            >
              <span>{shortNodeTitle(session.nodeSlug)}</span>
              <strong>
                {session.status === "completed"
                  ? "已完成"
                  : `继续 · ${session.progress}%`}
              </strong>
            </Link>
          ))
        ) : (
          <div className="empty-state">
            <p>你还没有保存的学习会话。</p>
            <Link className="button button-accent" href="/learn/4p-stp">
              开始第一节 →
            </Link>
          </div>
        )}
      </section>
      <aside className="dashboard-notes">
        <span className="section-kicker">认知笔记</span>
        {notes.length ? (
          notes.slice(0, 2).map((note) => (
            <article className="note-card" key={note.id}>
              <strong>{note.title}</strong>
              <p>{note.content.slice(0, 150)}…</p>
            </article>
          ))
        ) : (
          <p className="muted-copy">完成一节课程后，这里会出现你的判断笔记。</p>
        )}
      </aside>
      {recommendation && (
        <Link
          className="recommendation-card"
          href={`/nodes/${recommendation.slug}`}
        >
          <span>下一节推荐</span>
          <strong>{recommendation.title}</strong>
          <em>打开节点 →</em>
        </Link>
      )}
    </div>
  );
}

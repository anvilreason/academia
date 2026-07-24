"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
  nextAction: {
    type: "answer_path" | "capabilities";
    slug: string | null;
    pathTitle: string;
    capabilityLabel: string;
    label: string;
    title: string;
    description: string;
  };
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
          进入学籍入口
        </Link>
      </div>
    );
  }

  const { sessions, notes, recommendation, nextAction } = query.data;
  return (
    <div className="dashboard-grid">
      <Link
        className="dashboard-next-action"
        href={
          nextAction.type === "answer_path" && nextAction.slug
            ? `/answers/${nextAction.slug}#start-path`
            : "/capabilities"
        }
      >
        <span>{nextAction.label}</span>
        <div>
          <small>{nextAction.pathTitle}</small>
          <h2>{nextAction.title}</h2>
          <p>{nextAction.description}</p>
          <em>目标能力 · {nextAction.capabilityLabel}</em>
        </div>
        <ArrowRight aria-hidden="true" />
      </Link>
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
            <p>先从最接近你当前处境的问题开始。</p>
            <Link className="button button-accent" href="/answers">
              查看答案地图
              <ArrowRight aria-hidden="true" size={16} />
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
          <p className="muted-copy">完成一门课程后，这里会留下你的判断与疑问。</p>
        )}
      </aside>
      {recommendation && (
        <Link
          className="recommendation-card"
          href={`/courses/${recommendation.slug}`}
        >
          <span>继续阅读</span>
          <strong>{recommendation.title}</strong>
          <em>
            查看课程
            <ArrowRight aria-hidden="true" size={15} />
          </em>
        </Link>
      )}
    </div>
  );
}

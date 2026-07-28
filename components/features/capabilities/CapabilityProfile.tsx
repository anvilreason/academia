"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  FileCheck2,
  RotateCcw,
} from "lucide-react";
import { ArtifactShareControl } from "@/components/features/capabilities/ArtifactShareControl";

type CapabilityData = {
  paths: Array<{
    slug: string;
    title: string;
    capabilityLabel: string;
    capabilityDomain: string;
    level: number;
    levelLabel: string;
    status: string;
    evidenceCount: number;
    artifactCount: number;
    revisionCount: number;
    latestScore: number | null;
    latestReviewRequiredRevision: boolean | null;
    publishableArtifact: null | {
      id: string;
      title: string;
      version: number;
      share: null | {
        publicSlug: string;
        status: string;
      };
    };
    sources: Array<{
      type: string;
      label: string;
      occurredAt: string;
    }>;
    nextStep: {
      label: string;
      title: string;
      description: string;
    };
  }>;
  summary: {
    completed: number;
    active: number;
    evidence: number;
    artifacts: number;
    revisions: number;
  };
  recommendation: null | {
    slug: string;
    title: string;
    capabilityLabel: string;
    reason: string;
  };
};

async function loadCapabilities() {
  const response = await fetch("/api/me/capabilities");
  const payload = (await response.json()) as {
    data?: CapabilityData;
    error?: { message?: string };
  };
  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message || "暂时无法读取能力档案");
  }
  return payload.data;
}

export function CapabilityProfile() {
  const query = useQuery({
    queryKey: ["capability-profile"],
    queryFn: loadCapabilities,
  });

  if (query.isPending) {
    return (
      <div className="capability-loading">
        <CircleDashed aria-hidden="true" />
        正在核对作品、审阅与现实结果…
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="empty-state">
        <p>{query.error.message}</p>
        <Link className="button button-dark" href="/login">
          进入学籍入口
        </Link>
      </div>
    );
  }

  const { paths, recommendation, summary } = query.data;
  return (
    <div className="capability-profile">
      <header className="capability-hero">
        <div>
          <p className="eyebrow">CAPABILITY, WITH PROVENANCE</p>
          <h1>能力不是自我评价，<br />而是留下来源的现实记录。</h1>
          <p>
            每一项能力都连接行动、证据、作品、审阅、修订和真实结果。
            成绩可以保留，但不能替代你独立做成过什么。
          </p>
        </div>
        <dl>
          <div><dt>已完成路径</dt><dd>{summary.completed}<small>/6</small></dd></div>
          <div><dt>现实证据</dt><dd>{summary.evidence}</dd></div>
          <div><dt>作品版本</dt><dd>{summary.artifacts}</dd></div>
          <div><dt>主动修订</dt><dd>{summary.revisions}</dd></div>
        </dl>
      </header>

      {recommendation && (
        <Link
          className="capability-recommendation"
          href={`/answers/${recommendation.slug}#start-path`}
        >
          <span>当前建议</span>
          <div>
            <strong>{recommendation.title}</strong>
            <p>{recommendation.reason} 目标能力：{recommendation.capabilityLabel}。</p>
          </div>
          <ArrowRight aria-hidden="true" />
        </Link>
      )}

      <section className="capability-map">
        <header>
          <p className="eyebrow">SIX FOUNDATIONAL CAPABILITIES</p>
          <h2>六条旗舰路径形成的能力底图</h2>
        </header>
        <div className="capability-grid">
          {paths.map((path, index) => (
            <article
              data-status={path.status}
              key={path.slug}
              className="capability-card"
            >
              <header>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {path.status === "completed" ? (
                  <CheckCircle2 aria-label="已完成" />
                ) : (
                  <i>{path.capabilityDomain}</i>
                )}
              </header>
              <h3>{path.capabilityLabel}</h3>
              <p>{path.title}</p>
              <div className="capability-level">
                <span>当前层级</span>
                <strong>{path.levelLabel}</strong>
                <i style={{ width: `${Math.max(4, path.level * 20)}%` }} />
              </div>
              <dl>
                <div><dt>证据</dt><dd>{path.evidenceCount}</dd></div>
                <div><dt>作品</dt><dd>{path.artifactCount}</dd></div>
                <div><dt>修订</dt><dd>{path.revisionCount}</dd></div>
                <div><dt>最近量规</dt><dd>{path.latestScore ?? "—"}{path.latestScore !== null && <small>/24</small>}</dd></div>
              </dl>
              {path.sources.length > 0 && (
                <div className="capability-sources">
                  <span>最近来源</span>
                  {path.sources.slice(-3).reverse().map((source, sourceIndex) => (
                    <p key={`${source.type}-${sourceIndex}`}>
                      <FileCheck2 aria-hidden="true" />
                      <b>{source.type}</b>
                      {source.label}
                    </p>
                  ))}
                </div>
              )}
              {path.publishableArtifact && (
                <ArtifactShareControl
                  artifactId={path.publishableArtifact.id}
                  artifactTitle={path.publishableArtifact.title}
                  artifactVersion={path.publishableArtifact.version}
                  initialShare={path.publishableArtifact.share}
                />
              )}
              <footer>
                <div>
                  <span>{path.nextStep.label}</span>
                  <strong>{path.nextStep.title}</strong>
                </div>
                <Link href={`/answers/${path.slug}#start-path`}>
                  {path.status === "completed" ? (
                    <RotateCcw aria-hidden="true" />
                  ) : (
                    <ArrowRight aria-hidden="true" />
                  )}
                  {path.status === "not_started" ? "开始" : "进入路径"}
                </Link>
              </footer>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

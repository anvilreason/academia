"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ProductShell } from "@/components/shared/ProductShell";

type TranscriptData = {
  earnedCredits: number;
  gpa: number;
  records: Array<{
    id: string;
    nodeSlug: string;
    courseTitle: string;
    courseCode: string;
    score: number;
    gradePoint: number;
    creditsEarned: number;
    attemptNumber: number;
    weakTopics: string[];
  }>;
};

async function loadTranscript() {
  const response = await fetch("/api/me/transcript");
  const payload = (await response.json()) as {
    data?: TranscriptData;
    error?: { message?: string };
  };
  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message || "暂时无法读取成绩");
  }
  return payload.data;
}

export default function TranscriptPage() {
  const transcript = useQuery({
    queryKey: ["transcript"],
    queryFn: loadTranscript,
  });
  return (
    <ProductShell context="学分与 GPA" title="学籍与成绩">
      <main className="university-page transcript-page">
        <header className="transcript-hero">
          <div>
            <p className="eyebrow">ACADEMIC RECORD</p>
            <h1>每一次考试，都指向下一次掌握。</h1>
          </div>
          <div className="transcript-summary">
            <span>
              <strong>{transcript.data?.earnedCredits ?? "—"}</strong>已获学分
            </span>
            <span>
              <strong>{transcript.data?.gpa?.toFixed(2) ?? "—"}</strong>累计 GPA
            </span>
          </div>
        </header>
        {transcript.isError ? (
          <div className="wallet-state">
            <p>{transcript.error.message}</p>
            <Link className="button button-accent" href="/login">
              登录查看
            </Link>
          </div>
        ) : transcript.data?.records.length ? (
          <div className="transcript-records">
            {transcript.data.records.map((record) => (
              <article key={record.id}>
                <div>
                  <span>{record.courseCode}</span>
                  <h2>{record.courseTitle}</h2>
                  <p>
                    第 {record.attemptNumber} 次考试 ·{" "}
                    {record.weakTopics.length
                      ? `建议重修：${record.weakTopics.join("、")}`
                      : "知识点掌握良好"}
                  </p>
                </div>
                <dl>
                  <div>
                    <dt>成绩</dt>
                    <dd>{record.score}</dd>
                  </div>
                  <div>
                    <dt>绩点</dt>
                    <dd>{record.gradePoint.toFixed(1)}</dd>
                  </div>
                  <div>
                    <dt>学分</dt>
                    <dd>{record.creditsEarned}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <div className="wallet-state">
            <h2>成绩单还在等待第一门课</h2>
            <p>课程学习完成后参加期末考试，通过即可获得学分并计入 GPA。</p>
            <Link className="button button-accent" href="/college">
              选择专业
            </Link>
          </div>
        )}
      </main>
    </ProductShell>
  );
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ProductShell } from "@/components/shared/ProductShell";

type TranscriptData = {
  earnedCredits: number;
  recognizedCredits: number;
  gpa: number;
  recognitions: Array<{
    id: string;
    status: string;
    targetTitle: string;
    targetCode: string;
    sourceTitle: string;
    recognizedCredits: number;
    remainingCredits: number;
  }>;
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
            <h1>成绩记录抵达，也记录仍未抵达。</h1>
          </div>
          <div className="transcript-summary">
            <span>
              <strong>{transcript.data?.earnedCredits ?? "—"}</strong>已获学分
            </span>
            <span>
              <strong>{transcript.data?.gpa?.toFixed(2) ?? "—"}</strong>累计 GPA
            </span>
            <span>
              <strong>{transcript.data?.recognizedCredits ?? "—"}</strong>
              互认学分
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
        ) : transcript.data?.records.length ||
          transcript.data?.recognitions.length ? (
          <>
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
            {!!transcript.data.recognitions.length && (
              <section className="transcript-recognitions">
                <div>
                  <p className="eyebrow">CREDIT RECOGNITION</p>
                  <h2>跨专业课程互认</h2>
                </div>
                {transcript.data.recognitions.map((record) => (
                  <article key={record.id}>
                    <div>
                      <span>{record.targetCode}</span>
                      <h3>{record.targetTitle}</h3>
                      <p>依据已修《{record.sourceTitle}》认定</p>
                    </div>
                    <strong>
                      {record.recognizedCredits} 已认定
                      {record.remainingCredits
                        ? ` · ${record.remainingCredits} 待补修`
                        : " · 已完成"}
                    </strong>
                  </article>
                ))}
              </section>
            )}
          </>
        ) : (
          <div className="wallet-state">
            <h2>成绩单还在等待第一门课</h2>
            <p>完成课程并通过期末考试后，学分与绩点会写入这里。</p>
            <Link className="button button-accent" href="/college">
              前往学院
            </Link>
          </div>
        )}
      </main>
    </ProductShell>
  );
}

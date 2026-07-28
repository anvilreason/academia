"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, FileCheck2, Link2 } from "lucide-react";

type ResultRecognitionState = {
  graphVersion: string;
  course: {
    slug: string;
    title: string;
    credits: number;
    availability: string;
  };
  eligible: Array<{
    enrollmentId: string;
    pathSlug: string;
    pathTitle: string;
    artifactTitle: string;
    artifactVersion: number;
    capabilityLabel: string;
    role: string;
    availableCredits: number;
    alreadyRecognized: boolean;
    recognizedCourseSlug: string | null;
  }>;
  recognitions: Array<{
    enrollmentId: string;
    pathSlug: string;
    recognizedCredits: number;
  }>;
  recognizedCredits: number;
  remainingCredits: number;
  rule: string;
};

async function loadResultRecognition(courseSlug: string) {
  const response = await fetch(
    `/api/me/courses/${courseSlug}/result-recognition`,
  );
  const payload = (await response.json()) as {
    data?: ResultRecognitionState;
    error?: { message?: string };
  };
  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message || "暂时无法核验作品记录");
  }
  return payload.data;
}

export function ResultRecognitionPanel({
  courseSlug,
}: {
  courseSlug: string;
}) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["result-recognition", courseSlug, session?.user?.email],
    enabled: Boolean(session?.user),
    queryFn: () => loadResultRecognition(courseSlug),
  });

  async function recognize(enrollmentId: string) {
    setBusyId(enrollmentId);
    setError(null);
    try {
      const response = await fetch(
        `/api/me/courses/${courseSlug}/result-recognition`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ enrollmentId }),
        },
      );
      const payload = (await response.json()) as {
        error?: { message?: string };
      };
      if (!response.ok) {
        throw new Error(payload.error?.message || "暂时无法写入认定结果");
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["result-recognition", courseSlug],
        }),
        queryClient.invalidateQueries({
          queryKey: ["course-recognition", courseSlug],
        }),
        queryClient.invalidateQueries({ queryKey: ["program-audit"] }),
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "暂时无法完成认定");
    } finally {
      setBusyId(null);
    }
  }

  if (!session?.user) {
    return (
      <aside className="result-recognition result-recognition-quiet">
        <Link2 aria-hidden="true" />
        <div>
          <span>现实成果互认</span>
          <p>
            进入学籍后，系统会核对你已完成的答案路径。审阅通过的作品可用于免除重复实践。
          </p>
          <Link href={`/login?continue=/courses/${courseSlug}`}>
            核验我的作品
            <ArrowRight aria-hidden="true" size={14} />
          </Link>
        </div>
      </aside>
    );
  }
  if (query.isPending) {
    return <aside className="result-recognition">正在核对现实作品…</aside>;
  }
  if (query.isError || !query.data) {
    return (
      <aside className="result-recognition">
        暂时无法读取现实成果互认记录
      </aside>
    );
  }

  const data = query.data;
  const available = data.eligible.filter((item) => !item.alreadyRecognized);
  const usedElsewhere = data.eligible.filter(
    (item) =>
      item.alreadyRecognized && item.recognizedCourseSlug !== courseSlug,
  );

  return (
    <section className="result-recognition">
      <header>
        <div>
          <p className="eyebrow">RESULT RECOGNITION</p>
          <h2>你做成过的事，不必在课程里重新表演。</h2>
        </div>
        <div className="result-credit-summary">
          <strong>{data.recognizedCredits}</strong>
          <span>实践学分已认定</span>
          <small>{data.remainingCredits} 学分仍需学习与检验</small>
        </div>
      </header>
      <p className="result-recognition-rule">{data.rule}</p>

      {data.recognitions.map((recognition) => {
        const source = data.eligible.find(
          (item) => item.enrollmentId === recognition.enrollmentId,
        );
        return (
          <article className="recognized-result" key={recognition.enrollmentId}>
            <CheckCircle2 aria-hidden="true" />
            <div>
              <span>已写入课程记录 · {recognition.recognizedCredits} 学分</span>
              <strong>{source?.artifactTitle ?? recognition.pathSlug}</strong>
              <p>{source?.role}</p>
            </div>
            <Link href={`/answers/${recognition.pathSlug}`}>
              查看来源
              <ArrowRight aria-hidden="true" size={14} />
            </Link>
          </article>
        );
      })}

      {available.map((source) => (
        <article className="eligible-result" key={source.enrollmentId}>
          <FileCheck2 aria-hidden="true" />
          <div>
            <span>
              可认定 {source.availableCredits} 学分 · 作品 v
              {source.artifactVersion}
            </span>
            <strong>{source.artifactTitle}</strong>
            <p>{source.role}</p>
            <small>来源：{source.pathTitle}</small>
          </div>
          <button
            disabled={Boolean(busyId)}
            onClick={() => recognize(source.enrollmentId)}
            type="button"
          >
            {busyId === source.enrollmentId ? "正在核验…" : "确认用于本课程"}
            <ArrowRight aria-hidden="true" size={14} />
          </button>
        </article>
      ))}

      {!data.recognitions.length && !available.length && (
        <div className="result-recognition-empty">
          <p>
            目前没有同时满足“作品审阅通过”和“现实结果已记录”的相关成果。
          </p>
          <Link href="/answers">
            从一个真实问题开始
            <ArrowRight aria-hidden="true" size={14} />
          </Link>
        </div>
      )}
      {usedElsewhere.length > 0 && (
        <p className="result-recognition-note">
          {usedElsewhere.length} 份相关成果已用于其他课程。为保持证明可信，同一份成果不重复抵扣。
        </p>
      )}
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}

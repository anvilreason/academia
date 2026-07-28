"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Layers3, Scale } from "lucide-react";

type RecognitionQuote = {
  type: "none" | "full" | "bridge";
  sourceCourseSlug: string | null;
  sourceCourseTitle: string | null;
  recognizedCredits: number;
  remainingCredits: number;
  priceFen: number;
  reason: string;
  targetCredits: number;
  targetRigorLevel: number;
  status:
    | "completed"
    | "recognized"
    | "bridge_required"
    | "result_recognized"
    | "eligible"
    | "unavailable";
  resultRecognizedCredits: number;
  resultRecognitionCount: number;
};

async function getQuote(courseSlug: string) {
  const response = await fetch(`/api/me/courses/${courseSlug}/recognition`);
  if (!response.ok) throw new Error("暂时无法核验学分记录");
  const payload = (await response.json()) as { data: RecognitionQuote };
  return payload.data;
}

export function CourseRecognitionPanel({
  courseSlug,
}: {
  courseSlug: string;
}) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const quote = useQuery({
    queryKey: ["course-recognition", courseSlug, session?.user?.email],
    enabled: Boolean(session?.user),
    queryFn: () => getQuote(courseSlug),
  });

  async function acceptRecognition() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/me/courses/${courseSlug}/recognition`,
        { method: "POST" },
      );
      const payload = (await response.json()) as {
        error?: { message?: string };
      };
      if (!response.ok) {
        throw new Error(payload.error?.message || "暂时无法写入互认结果");
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["course-recognition", courseSlug],
        }),
        queryClient.invalidateQueries({ queryKey: ["academic-plan"] }),
        queryClient.invalidateQueries({ queryKey: ["program-audit"] }),
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "暂时无法完成互认");
    } finally {
      setBusy(false);
    }
  }

  if (!session?.user) {
    return (
      <aside className="recognition-panel recognition-panel-quiet">
        <div>
          <Scale aria-hidden="true" />
          <span>学分互认</span>
        </div>
        <p>
          建立学籍后，系统会核对你在其他专业已经通过的课程，并自动免除重复内容。
        </p>
        <Link href={`/login?continue=/courses/${courseSlug}`}>
          进入学籍后核验
          <ArrowRight aria-hidden="true" size={14} />
        </Link>
      </aside>
    );
  }

  if (quote.isLoading) {
    return (
      <aside className="recognition-panel recognition-panel-loading">
        正在核对你的已修课程…
      </aside>
    );
  }

  if (quote.isError || !quote.data) {
    return (
      <aside className="recognition-panel recognition-panel-quiet">
        暂时无法读取学分互认结果
      </aside>
    );
  }

  const data = quote.data;
  if (data.status === "completed" || data.status === "recognized") {
    return (
      <aside className="recognition-panel recognition-panel-complete">
        <div className="recognition-heading">
          <span className="recognition-icon">
            <Check aria-hidden="true" />
          </span>
          <div>
            <small>已计入当前培养方案</small>
            <h3>{data.status === "completed" ? "课程已完成" : "学分互认完成"}</h3>
          </div>
        </div>
        <p>{data.reason}</p>
        <div className="credit-equation">
          <span>{data.targetCredits} 目标学分</span>
          <i>−</i>
          <span>{data.recognizedCredits} 已认定</span>
          <b>= 0 待修</b>
        </div>
      </aside>
    );
  }

  if (
    data.status === "bridge_required" ||
    data.status === "result_recognized"
  ) {
    return (
      <aside className="recognition-panel recognition-panel-bridge">
        <div className="recognition-heading">
          <span className="recognition-icon">
            <Layers3 aria-hidden="true" />
          </span>
          <div>
            <small>
              {data.status === "result_recognized"
                ? "真实作品已计入课程"
                : "差异学习路径已经建立"}
            </small>
            <h3>
              {data.status === "result_recognized"
                ? "实践无需重做，核心理解仍需检验"
                : "不从头重学，只补足不同部分"}
            </h3>
          </div>
        </div>
        <p>{data.reason}</p>
        <div className="credit-equation">
          <span>{data.targetCredits} 目标学分</span>
          <i>−</i>
          <span>{data.recognizedCredits} 已认定</span>
          <b>= {data.remainingCredits} 待修</b>
        </div>
      </aside>
    );
  }

  if (data.status === "eligible" && data.type !== "none") {
    return (
      <aside
        className={`recognition-panel ${
          data.type === "full"
            ? "recognition-panel-full"
            : "recognition-panel-bridge"
        }`}
      >
        <div className="recognition-heading">
          <span className="recognition-icon">
            {data.type === "full" ? (
              <Check aria-hidden="true" />
            ) : (
              <Layers3 aria-hidden="true" />
            )}
          </span>
          <div>
            <small>发现可互认课程</small>
            <h3>
              {data.type === "full"
                ? "可以直接标记为已完成"
                : "只需学习差异部分"}
            </h3>
          </div>
        </div>
        <p>
          已通过《{data.sourceCourseTitle}》。{data.reason}
        </p>
        <div className="credit-equation">
          <span>{data.targetCredits} 目标学分</span>
          <i>−</i>
          <span>{data.recognizedCredits} 已认定</span>
          <b>= {data.remainingCredits} 待修</b>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button disabled={busy} onClick={acceptRecognition} type="button">
          {busy
            ? "正在写入学籍…"
            : data.type === "full"
              ? "确认互认并标记完成"
              : "建立差异学习路径"}
          <ArrowRight aria-hidden="true" size={15} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="recognition-panel recognition-panel-quiet">
      <div>
        <Scale aria-hidden="true" />
        <span>学分核验完成</span>
      </div>
      <p>目前没有内容相同的已修课程，这门课需要完整学习。</p>
      <div className="credit-equation">
        <span>{data.targetCredits} 目标学分</span>
        <b>= {data.remainingCredits} 待修</b>
      </div>
    </aside>
  );
}

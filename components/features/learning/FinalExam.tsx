"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ExamPayload = {
  course: {
    title: string;
    credits: number;
    passScore: number;
    maxGradePoint: number;
  };
  questions: Array<{
    id: number;
    prompt: string;
    choices: string[];
    topic: string;
  }>;
};

type ExamResult = {
  score: number;
  gradePoint: number;
  creditsEarned: number;
  passed: boolean;
  weakTopics: string[];
  attemptNumber: number;
  note?: { title: string; content: string };
  recommendation?: { slug: string; title: string };
};

export function FinalExam({
  sessionId,
  nodeSlug,
}: {
  sessionId: string;
  nodeSlug: string;
}) {
  const [exam, setExam] = useState<ExamPayload | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<ExamResult | null>(null);
  const [phase, setPhase] = useState<
    "intro" | "loading" | "exam" | "submitting" | "result"
  >("intro");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (phase !== "loading") return;
    fetch(`/api/learning-sessions/${sessionId}/exam`)
      .then(async (response) => {
        const payload = (await response.json()) as {
          data?: ExamPayload;
          error?: { message?: string };
        };
        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "暂时无法载入考试");
        }
        setExam(payload.data);
        setPhase("exam");
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "暂时无法载入考试");
        setPhase("intro");
      });
  }, [phase, sessionId]);

  async function submitExam() {
    if (!exam || Object.keys(answers).length !== exam.questions.length) {
      setError("请完成全部题目后交卷。");
      return;
    }
    setPhase("submitting");
    setError(null);
    const response = await fetch(
      `/api/learning-sessions/${sessionId}/exam`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          answers: exam.questions.map((question) => answers[question.id]),
        }),
      },
    );
    const payload = (await response.json()) as {
      data?: ExamResult;
      error?: { message?: string };
    };
    if (!response.ok || !payload.data) {
      setError(payload.error?.message || "暂时无法提交考试");
      setPhase("exam");
      return;
    }
    setResult(payload.data);
    setPhase("result");
    if (payload.data.passed) {
      window.localStorage.removeItem(`academia-session-${nodeSlug}`);
    }
  }

  if (phase === "intro" || phase === "loading") {
    return (
      <aside className="completion-card exam-intro">
        <span className="test-badge">课程研习已完成</span>
        <h2>期末考试 · 看看哪些知识已经成为你的判断</h2>
        <p>
          共 5 题，60 分通过，成绩换算为最高 4.0 绩点。
          没有掌握的部分会回到重修清单，你可以随时回来再答一次。
        </p>
        {error && <div className="form-error">{error}</div>}
        <button
          className="button button-accent"
          disabled={phase === "loading"}
          onClick={() => setPhase("loading")}
          type="button"
        >
          {phase === "loading" ? "正在准备试卷…" : "进入期末考试 →"}
        </button>
      </aside>
    );
  }

  if (phase === "result" && result) {
    return (
      <aside
        className={`exam-result ${result.passed ? "passed" : "needs-retake"}`}
      >
        <span className="test-badge">
          第 {result.attemptNumber} 次考试 · {result.passed ? "通过" : "待重修"}
        </span>
        <div className="exam-score">
          <strong>{result.score}</strong>
          <span>
            成绩
            <br />
            GPA {result.gradePoint.toFixed(1)}
          </span>
        </div>
        <h2>
          {result.passed
            ? `已获得 ${result.creditsEarned} 学分`
            : "这次暂不授予学分，但你已经知道该回到哪里"}
        </h2>
        {result.weakTopics.length ? (
          <div className="weak-topics">
            <span>建议重修</span>
            {result.weakTopics.map((topic) => (
              <b key={topic}>{topic}</b>
            ))}
          </div>
        ) : (
          <p>所有核心知识点均已掌握。</p>
        )}
        {result.note && <p className="exam-note">{result.note.content}</p>}
        <div className="state-actions">
          {!result.passed && (
            <button
              className="button button-accent"
              onClick={() => {
                setAnswers({});
                setResult(null);
                setPhase("exam");
              }}
              type="button"
            >
              回到薄弱知识点
            </button>
          )}
          {result.passed && result.recommendation && (
            <Link
              className="button button-accent"
              href={`/courses/${result.recommendation.slug}`}
            >
              下一门：{result.recommendation.title} →
            </Link>
          )}
          <Link className="button button-dark" href="/transcript">
            打开学籍记录
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside className="final-exam">
      <header>
        <div>
          <span className="test-badge">期末考试</span>
          <h2>{exam?.course.title}</h2>
        </div>
        <div>
          {exam?.course.credits} 学分 · 最高 GPA {exam?.course.maxGradePoint}
        </div>
      </header>
      <ol>
        {exam?.questions.map((question, index) => (
          <li key={question.id}>
            <p>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {question.prompt}
            </p>
            <div className="exam-choices">
              {question.choices.map((choice, choiceIndex) => (
                <label key={choice}>
                  <input
                    checked={answers[question.id] === choiceIndex}
                    name={`question-${question.id}`}
                    onChange={() =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: choiceIndex,
                      }))
                    }
                    type="radio"
                  />
                  <span>{choice}</span>
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>
      {error && <div className="form-error">{error}</div>}
      <button
        className="button button-accent button-block"
        disabled={phase === "submitting"}
        onClick={submitExam}
        type="button"
      >
        {phase === "submitting" ? "正在评阅…" : "交卷"}
      </button>
    </aside>
  );
}

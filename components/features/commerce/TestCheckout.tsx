"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, GitCompareArrows } from "lucide-react";

type RecognitionQuote = {
  type: "none" | "full" | "bridge";
  sourceCourseTitle: string | null;
  recognizedCredits: number;
  remainingCredits: number;
  priceFen: number;
  reason: string;
  status: string;
};

export function TestCheckout({
  nodeSlug,
  credits,
}: {
  nodeSlug: string;
  credits: number;
}) {
  const [busy, setBusy] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<RecognitionQuote | null>(null);
  const [quoteReady, setQuoteReady] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/me/courses/${nodeSlug}/recognition`)
      .then(async (response) => {
        if (response.status === 401) return null;
        if (!response.ok) throw new Error("暂时无法核验学分");
        const payload = (await response.json()) as {
          data: RecognitionQuote;
        };
        return payload.data;
      })
      .then((data) => {
        if (active) setQuote(data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setQuoteReady(true);
      });
    return () => {
      active = false;
    };
  }, [nodeSlug]);

  async function writeRecognition() {
    const response = await fetch(
      `/api/me/courses/${nodeSlug}/recognition`,
      { method: "POST" },
    );
    const payload = (await response.json()) as {
      error?: { message?: string };
    };
    if (response.status === 401) {
      setNeedsLogin(true);
      throw new Error("建立学籍后才能写入课程互认记录。");
    }
    if (!response.ok) {
      throw new Error(payload.error?.message || "暂时无法写入互认结果");
    }
  }

  async function enrol() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNeedsLogin(false);
    try {
      if (
        quote &&
        quote.type !== "none" &&
        quote.status === "eligible"
      ) {
        await writeRecognition();
        if (quote.type === "full") {
          setEnrolled(true);
          return;
        }
      }
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nodeSlug,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const orderPayload = (await orderResponse.json()) as {
        data?: { id: string };
        error?: { message?: string };
      };
      if (orderResponse.status === 401) {
        setNeedsLogin(true);
        throw new Error("建立学籍后，这门课才能进入你的培养方案。");
      }
      if (!orderResponse.ok || !orderPayload.data) {
        throw new Error(orderPayload.error?.message || "暂时无法完成选课登记");
      }
      const confirmResponse = await fetch(
        `/api/orders/${orderPayload.data.id}/test-confirm`,
        { method: "POST" },
      );
      const confirmPayload = (await confirmResponse.json()) as {
        error?: { message?: string };
      };
      if (!confirmResponse.ok) {
        throw new Error(confirmPayload.error?.message || "选课登记尚未完成");
      }
      setEnrolled(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "暂时无法完成选课登记");
    } finally {
      setBusy(false);
    }
  }

  const alreadyCovered =
    quote?.type === "full" &&
    (quote.status === "completed" || quote.status === "recognized");

  if (enrolled || alreadyCovered) {
    return (
      <div className="checkout-success">
        <span className="test-badge">选课登记完成</span>
        <h3>
          {quote?.type === "full"
            ? "课程互认已经写入培养方案"
            : "这门课已经进入你的培养方案"}
        </h3>
        <p>
          {quote?.type === "full"
            ? "这门课不需要重复学习，也不会重复计费。"
            : "课堂对话、考试与笔记都会写入你的学籍记录。"}
        </p>
        {quote?.type !== "full" && (
        <Link
          className="button button-accent button-large"
          href={`/learn/${nodeSlug}`}
        >
          进入课堂
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
        )}
      </div>
    );
  }

  return (
    <div className="checkout-panel">
      <div className="checkout-credit-pricing">
        <div>
          {quote?.type === "full" ? (
            <Check aria-hidden="true" />
          ) : (
            <GitCompareArrows aria-hidden="true" />
          )}
          <span>按净学分核算</span>
        </div>
        {quoteReady ? (
          <>
            <div className="checkout-credit-equation">
              <span>{credits} 课程学分</span>
              <i>−</i>
              <span>{quote?.recognizedCredits ?? 0} 已修学分</span>
              <b>
                = {quote?.remainingCredits ?? credits} 计价学分
              </b>
            </div>
            {quote?.sourceCourseTitle && (
              <p>
                已修《{quote.sourceCourseTitle}》：{quote.reason}
              </p>
            )}
            <strong className="checkout-test-price">
              {quote?.type === "full"
                ? "无需重复支付"
                : `测试订单 ¥${((quote?.priceFen ?? credits * 2475) / 100).toFixed(2)}`}
            </strong>
          </>
        ) : (
          <p>正在核对已经完成的课程…</p>
        )}
      </div>
      <p className="enrolment-note">
        加入后，你可以从左侧课程目录回到这里。课程完成前，学习进度会持续保留。
      </p>
      {error && <div className="form-error">{error}</div>}
      {needsLogin ? (
        <Link
          className="button button-dark button-block"
          href={`/login?mode=register&continue=${encodeURIComponent(
            `/checkout/${nodeSlug}`,
          )}`}
        >
          建立学籍后继续
        </Link>
      ) : (
        <button
          className="button button-accent button-block"
          disabled={busy}
          onClick={enrol}
          type="button"
        >
          {busy
            ? "正在登记…"
            : quote?.type === "full"
              ? "确认互认，不重复修习"
              : quote?.type === "bridge"
                ? "只加入差异学习部分"
                : "加入我的培养方案"}
        </button>
      )}
    </div>
  );
}

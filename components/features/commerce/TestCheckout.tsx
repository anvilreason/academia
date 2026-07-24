"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function TestCheckout({ nodeSlug }: { nodeSlug: string }) {
  const [busy, setBusy] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enrol() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNeedsLogin(false);
    try {
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

  if (enrolled) {
    return (
      <div className="checkout-success">
        <span className="test-badge">选课登记完成</span>
        <h3>这门课已经进入你的培养方案</h3>
        <p>课堂对话、考试与笔记都会写入你的学籍记录。</p>
        <Link
          className="button button-accent button-large"
          href={`/learn/${nodeSlug}`}
        >
          进入课堂
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-panel">
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
          {busy ? "正在登记…" : "加入我的培养方案"}
        </button>
      )}
    </div>
  );
}

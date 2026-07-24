"use client";

import { useState } from "react";
import Link from "next/link";

export function TestCheckout({
  nodeSlug,
  priceYuan,
}: {
  nodeSlug: string;
  priceYuan: number;
}) {
  const [busy, setBusy] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unlock() {
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
        throw new Error("请先注册或登录，再创建测试订单");
      }
      if (!orderResponse.ok || !orderPayload.data) {
        throw new Error(orderPayload.error?.message || "暂时无法创建订单");
      }
      const confirmResponse = await fetch(
        `/api/orders/${orderPayload.data.id}/test-confirm`,
        { method: "POST" },
      );
      const confirmPayload = (await confirmResponse.json()) as {
        error?: { message?: string };
      };
      if (!confirmResponse.ok) {
        throw new Error(confirmPayload.error?.message || "测试确认失败");
      }
      setUnlocked(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "测试解锁失败");
    } finally {
      setBusy(false);
    }
  }

  if (unlocked) {
    return (
      <div className="checkout-success">
        <span className="test-badge">测试订单已确认 · ¥0 实际扣款</span>
        <h3>Porter 五力已加入你的学院地图</h3>
        <p>订单和课程权限已经真实写入测试数据库。</p>
        <Link
          className="button button-accent button-large"
          href={`/learn/${nodeSlug}`}
        >
          进入课程 →
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-panel">
      <div className="checkout-price">
        <span>测试标价</span>
        <strong>¥{priceYuan}</strong>
      </div>
      <div className="checkout-warning">
        <strong>不会真实扣款</strong>
        <span>不要填写银行卡、支付密码或任何真实支付资料。</span>
      </div>
      {error && <div className="form-error">{error}</div>}
      {needsLogin ? (
        <Link
          className="button button-dark button-block"
          href={`/login?mode=register&continue=${encodeURIComponent(
            `/nodes/${nodeSlug}`,
          )}`}
        >
          注册后继续测试购买
        </Link>
      ) : (
        <button
          className="button button-accent button-block"
          disabled={busy}
          onClick={unlock}
          type="button"
        >
          {busy ? "正在创建测试订单…" : `确认测试订单 · 显示 ¥${priceYuan}`}
        </button>
      )}
    </div>
  );
}

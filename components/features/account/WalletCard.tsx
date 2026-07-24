"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { membershipLevels } from "@/lib/domain/grading";

type WalletPayload = {
  balanceFen: number;
  completedSpendFen: number;
  membership: { name: string; thresholdFen: number; description: string };
};

const amounts = [300, 500, 1000, 2000, 5000, 10000];

async function loadWallet() {
  const response = await fetch("/api/me/wallet");
  if (response.status === 401) throw new Error("UNAUTHORIZED");
  const payload = (await response.json()) as {
    data?: WalletPayload;
    error?: { message?: string };
  };
  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message || "暂时无法读取学籍卡");
  }
  return payload.data;
}

export function WalletCard() {
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: loadWallet });
  const [busyAmount, setBusyAmount] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function topUp(amount: number) {
    setBusyAmount(amount);
    setMessage(null);
    const response = await fetch("/api/me/wallet/topup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amountFen: amount * 100 }),
    });
    const payload = (await response.json()) as {
      data?: WalletPayload;
      error?: { message?: string };
    };
    setBusyAmount(null);
    if (!response.ok) {
      setMessage(payload.error?.message || "测试储值失败");
      return;
    }
    setMessage(`测试储值 ¥${amount} 已写入余额；学籍等级保持不变。`);
    await wallet.refetch();
  }

  if (wallet.isPending) {
    return <div className="wallet-state">正在读取你的学籍卡…</div>;
  }
  if (wallet.isError && wallet.error.message === "UNAUTHORIZED") {
    return (
      <div className="wallet-state">
        <h2>登录后领取星图学籍卡</h2>
        <p>储值、已完成课程消费与等级会保存在你的账户中。</p>
        <Link className="button button-accent" href="/login">
          登录或注册
        </Link>
      </div>
    );
  }
  if (!wallet.data) return <div className="wallet-state">暂时无法读取学籍卡。</div>;

  return (
    <>
      <section className="constellation-card">
        <div className="card-orbit" aria-hidden="true" />
        <div className="card-heading">
          <div>
            <span>ACADEMIA STUDENT ACCOUNT</span>
            <h2>星图学籍卡</h2>
          </div>
          <strong>{wallet.data.membership.name}</strong>
        </div>
        <div className="card-balance">
          <span>可用测试余额</span>
          <b>¥{(wallet.data.balanceFen / 100).toLocaleString("zh-CN")}</b>
        </div>
        <div className="card-foot">
          <span>
            已完成课程消费 ¥
            {(wallet.data.completedSpendFen / 100).toLocaleString("zh-CN")}
          </span>
          <span>等级只由结业课程激活</span>
        </div>
      </section>

      <section className="wallet-topup">
        <div>
          <p className="eyebrow">测试储值</p>
          <h2>为之后的课程预存学习预算</h2>
          <p>
            储值只增加余额，不会提升会员等级。当前为功能测试，不会真实扣款，也不要填写任何支付资料。
          </p>
        </div>
        <div className="topup-options">
          {amounts.map((amount) => (
            <button
              disabled={busyAmount !== null}
              key={amount}
              onClick={() => topUp(amount)}
              type="button"
            >
              <span>储值</span>
              <strong>¥{amount.toLocaleString("zh-CN")}</strong>
              <small>{busyAmount === amount ? "写入中…" : "测试确认"}</small>
            </button>
          ))}
        </div>
        {message && <div className="wallet-message">{message}</div>}
      </section>

      <section className="membership-ladder">
        <div>
          <p className="eyebrow">学籍等级</p>
          <h2>学完，才算真正抵达</h2>
        </div>
        <div className="membership-levels">
          {membershipLevels.map((level) => (
            <div
              className={
                level.name === wallet.data?.membership.name ? "current" : ""
              }
              key={level.name}
            >
              <span>{level.name}</span>
              <strong>
                {level.thresholdFen
                  ? `结业 ¥${(level.thresholdFen / 100).toLocaleString("zh-CN")}`
                  : "初始等级"}
              </strong>
              <small>{level.description}</small>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { membershipLevels } from "@/lib/domain/grading";

const fellowshipDescriptions = [
  "第一张学术地图开始成形",
  "形成稳定的阅读与思考节奏",
  "能够把知识带回真实问题",
  "开始穿行于不同学科之间",
  "用实践检验所学的方法",
  "建立自己的问题与方法谱系",
  "帮助后来者找到进入知识的路",
] as const;

type WalletPayload = {
  balanceFen: number;
  completedSpendFen: number;
  membership: { name: string; thresholdFen: number; description: string };
};

async function loadWallet() {
  const response = await fetch("/api/me/wallet");
  if (response.status === 401) throw new Error("UNAUTHORIZED");
  const payload = (await response.json()) as {
    data?: WalletPayload;
    error?: { message?: string };
  };
  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message || "暂时无法读取学籍星图");
  }
  return payload.data;
}

export function WalletCard() {
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: loadWallet });

  if (wallet.isPending) {
    return <div className="wallet-state">正在展开你的学籍星图…</div>;
  }
  if (wallet.isError && wallet.error.message === "UNAUTHORIZED") {
    return (
      <div className="wallet-state">
        <h2>建立学籍后，学习才会留下轨迹</h2>
        <p>课程、成绩、笔记与书院称号会在这里汇成一张属于你的星图。</p>
        <Link className="button button-accent" href="/login">
          进入学籍入口
        </Link>
      </div>
    );
  }
  if (!wallet.data) return <div className="wallet-state">学籍星图暂时未能展开。</div>;

  const currentIndex = membershipLevels.findIndex(
    (level) => level.name === wallet.data?.membership.name,
  );

  return (
    <>
      <section className="constellation-card">
        <div className="card-orbit" aria-hidden="true" />
        <div className="card-heading">
          <div>
            <span>ACADEMIA FELLOWSHIP RECORD</span>
            <h2>学籍星图</h2>
          </div>
          <strong>{wallet.data.membership.name}</strong>
        </div>
        <div className="card-balance">
          <span>当前书院称号</span>
          <b>{wallet.data.membership.name}</b>
        </div>
        <div className="card-foot">
          <span>第 {Math.max(currentIndex + 1, 1)} 学段</span>
          <span>{fellowshipDescriptions[Math.max(currentIndex, 0)]}</span>
        </div>
      </section>

      <section className="membership-ladder">
        <div>
          <p className="eyebrow">FELLOWSHIP PATH</p>
          <h2>称号记录路程，不定义你是谁</h2>
          <p className="identity-copy">
            书院称号会随着结业课程自然变化。它只描述你已经完成的学习，
            不决定你能走向哪里。
          </p>
        </div>
        <div className="membership-levels">
          {membershipLevels.map((level, index) => (
            <div
              className={
                level.name === wallet.data?.membership.name ? "current" : ""
              }
              key={level.name}
            >
              <span>{level.name}</span>
              <strong>第 {index + 1} 学段</strong>
              <small>{fellowshipDescriptions[index]}</small>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

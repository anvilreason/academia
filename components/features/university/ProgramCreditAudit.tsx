"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, GitCompareArrows, Route } from "lucide-react";

type Audit = {
  program: { slug: string; name: string; requiredCredits: number };
  courses: Array<{
    status: string;
    type: "none" | "full" | "bridge";
    recognizedCredits: number;
  }>;
  completedCredits: number;
  recognizedCredits: number;
  remainingCredits: number;
  netPriceFen: number;
};

export function ProgramCreditAudit({
  programSlug,
}: {
  programSlug: string;
}) {
  const { data: session } = useSession();
  const audit = useQuery({
    queryKey: ["program-audit", programSlug, session?.user?.email],
    enabled: Boolean(session?.user),
    queryFn: async () => {
      const response = await fetch(`/api/me/programs/${programSlug}/audit`);
      if (!response.ok) throw new Error("暂时无法核验培养方案");
      const payload = (await response.json()) as { data: Audit };
      return payload.data;
    },
  });

  if (!session?.user) {
    return (
      <section className="program-audit program-audit-guest">
        <div>
          <p className="eyebrow">CREDIT RECOGNITION</p>
          <h2>不重复学习，也不重复计算学费。</h2>
        </div>
        <p>
          建立学籍后，培养方案会逐门核对你在其他专业已通过的课程；相同课程直接互认，
          难度不同的课程只留下差异部分。
        </p>
      </section>
    );
  }

  if (!audit.data) {
    return (
      <section className="program-audit program-audit-loading">
        正在核对你的课程与这个专业之间的重合部分…
      </section>
    );
  }

  const transferable = audit.data.courses.filter(
    (course) => course.type !== "none" && course.status !== "completed",
  ).length;
  const bridges = audit.data.courses.filter(
    (course) => course.type === "bridge",
  ).length;

  return (
    <section className="program-audit">
      <header>
        <div>
          <p className="eyebrow">我的培养方案核验</p>
          <h2>每一段已经完成的学习，都只计算一次。</h2>
        </div>
        <span>{audit.data.program.requiredCredits} 学分毕业要求</span>
      </header>
      <div className="program-audit-grid">
        <article>
          <CheckCircle2 aria-hidden="true" />
          <span>已经完成</span>
          <strong>{audit.data.completedCredits}</strong>
          <small>学分</small>
        </article>
        <article>
          <GitCompareArrows aria-hidden="true" />
          <span>可直接互认</span>
          <strong>{audit.data.recognizedCredits}</strong>
          <small>{transferable} 门课程</small>
        </article>
        <article>
          <Route aria-hidden="true" />
          <span>仍需修习</span>
          <strong>{audit.data.remainingCredits}</strong>
          <small>{bridges ? `${bridges} 门只修差异` : "按净学分计算"}</small>
        </article>
      </div>
      <p className="program-audit-note">
        后续开放正式支付时，只对仍需修习的净学分计价；已完成与已互认学分不会重复收费。
      </p>
    </section>
  );
}

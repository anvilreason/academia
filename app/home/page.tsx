import { ProductShell } from "@/components/shared/ProductShell";
import { Dashboard } from "@/components/features/dashboard/Dashboard";

export default function HomePage() {
  return (
    <ProductShell active="home" context="我的下一步" title="今天">
      <section className="content-page dashboard-page">
        <p className="eyebrow">YOUR NEXT MOVE</p>
        <h1>回到仍需行动的问题。</h1>
        <p className="content-lead">
          这里会逐步汇集你正在推进的路径、尚未提交的现实证据、
          反复出现的误区，以及下一门真正需要补足的课程。
        </p>
        <div style={{ marginTop: 44 }}>
          <Dashboard />
        </div>
      </section>
    </ProductShell>
  );
}

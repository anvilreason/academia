import { ProductShell } from "@/components/shared/ProductShell";
import { Dashboard } from "@/components/features/dashboard/Dashboard";

export default function HomePage() {
  return (
    <ProductShell active="home" context="我的书院" title="今天">
      <section className="content-page dashboard-page">
        <p className="eyebrow">继续思考</p>
        <h1>从上次停笔的地方继续。</h1>
        <p className="content-lead">
          今天不需要完成所有事。回到一门正在学习的课，或者重读一段仍未想明白的笔记。
        </p>
        <div style={{ marginTop: 44 }}>
          <Dashboard />
        </div>
      </section>
    </ProductShell>
  );
}

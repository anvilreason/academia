import { ProductShell } from "@/components/shared/ProductShell";
import { Dashboard } from "@/components/features/dashboard/Dashboard";

export default function HomePage() {
  return (
    <ProductShell active="home" context="测试账户" title="今天">
      <section className="content-page dashboard-page">
        <p className="eyebrow">继续思考</p>
        <h1>从上次停下的地方继续。</h1>
        <p className="content-lead">
          登录后，这里只保留与你当前学习有关的内容：一个继续入口、一条系统建议和最近形成的笔记。
        </p>
        <div style={{ marginTop: 44 }}>
          <Dashboard />
        </div>
      </section>
    </ProductShell>
  );
}

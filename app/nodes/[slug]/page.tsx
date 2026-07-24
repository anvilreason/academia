import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductShell } from "@/components/shared/ProductShell";
import { getNode } from "@/lib/content/nodes";

export default async function NodeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const node = getNode(slug);
  if (!node) notFound();

  return (
    <ProductShell active="college" context={node.level} title={node.title}>
      <section className="content-page node-detail-page">
        <span className="test-badge">TEST PURCHASE · 不会扣款</span>
        <p className="eyebrow" style={{ marginTop: 28 }}>
          {node.school} · {node.professor}
        </p>
        <h1>{node.title}</h1>
        <p className="content-lead">{node.description}</p>
        <div className="agent-card" style={{ marginTop: 46, maxWidth: 720 }}>
          <div className="agent-card-body" style={{ minHeight: 0 }}>
            <p className="agent-label">这一节从一个问题开始</p>
            <p className="agent-question">{node.question}</p>
            <p style={{ color: "var(--ink-faint)", margin: "28px 0 0" }}>
              {node.duration} · 永久保留学习记录 · 测试环境不产生真实扣款
            </p>
            <Link
              className="button button-accent button-large"
              href="/login"
              style={{ marginTop: 28 }}
            >
              测试解锁 ¥{node.priceYuan} →
            </Link>
          </div>
        </div>
      </section>
    </ProductShell>
  );
}

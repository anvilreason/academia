import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductShell } from "@/components/shared/ProductShell";
import { getNode } from "@/lib/content/nodes";
import { TestCheckout } from "@/components/features/commerce/TestCheckout";

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
            {node.slug === "porter-five-forces" ? (
              <TestCheckout
                nodeSlug={node.slug}
                priceYuan={node.priceYuan}
              />
            ) : node.slug === "4p-stp" ? (
              <Link
                className="button button-accent button-large"
                href="/learn/4p-stp"
                style={{ marginTop: 28 }}
              >
                免费试听 →
              </Link>
            ) : (
              <div className="checkout-warning" style={{ marginTop: 28 }}>
                <strong>建议先完成 Porter 五力</strong>
                <span>完成上一节后，这个节点会出现在你的下一节推荐中。</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </ProductShell>
  );
}

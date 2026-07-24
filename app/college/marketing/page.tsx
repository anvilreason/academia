import Link from "next/link";
import { ProductShell } from "@/components/shared/ProductShell";
import { nodes } from "@/lib/content/nodes";

export default function CollegePage() {
  return (
    <ProductShell active="college" context="3 个首发节点" title="Marketing">
      <section className="content-page map-page">
        <p className="eyebrow">学院地图</p>
        <h1>Marketing</h1>
        <p className="content-lead">
          从 Kotler 的基础框架，到 Porter 与 Christensen
          对竞争和变化的不同解释。先点亮一个节点，再让地图自然生长。
        </p>
        <div className="node-list" style={{ marginTop: 48 }}>
          {nodes.map((node, index) => (
            <Link
              className={`course-row ${node.access === "free" ? "course-row-featured" : ""}`}
              href={
                node.access === "free"
                  ? `/learn/${node.slug}`
                  : `/nodes/${node.slug}`
              }
              key={node.slug}
            >
              <span className="course-index">0{index + 1}</span>
              <span className="course-main">
                <span className="course-meta">
                  {node.level} · {node.school}
                </span>
                <strong>{node.title}</strong>
                <span>{node.description}</span>
              </span>
              <span className="course-price">
                {node.access === "free" ? "免费" : `¥${node.priceYuan}`}
                <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </ProductShell>
  );
}

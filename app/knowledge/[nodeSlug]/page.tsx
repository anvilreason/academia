import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CircleAlert } from "lucide-react";
import { AnalyticsSignal } from "@/components/analytics/AnalyticsSignal";
import { ProductShell } from "@/components/shared/ProductShell";
import { answerTopics } from "@/lib/content/answer-paths";
import {
  getResultKnowledgeNode,
  resultKnowledgeNodes,
  resultRelationsForKnowledgeNode,
} from "@/lib/content/result-knowledge-graph";
import { getUniversityCourse } from "@/lib/content/university";

export function generateStaticParams() {
  return resultKnowledgeNodes.map((node) => ({ nodeSlug: node.slug }));
}

export default async function KnowledgeNodePage({
  params,
}: {
  params: Promise<{ nodeSlug: string }>;
}) {
  const { nodeSlug } = await params;
  const node = getResultKnowledgeNode(nodeSlug);
  if (!node) notFound();
  const relations = resultRelationsForKnowledgeNode(node.slug);

  return (
    <ProductShell active="college" context="知识节点" title={node.title}>
      <AnalyticsSignal
        eventName="knowledge_node_opened"
        properties={{ knowledgeNodeSlug: node.slug }}
      />
      <article className="knowledge-node-page">
        <nav>
          <Link href="/college">
            <ArrowLeft aria-hidden="true" size={14} />
            学院地图
          </Link>
          <span>知识节点，不是独立课程</span>
        </nav>
        <header>
          <p className="eyebrow">KNOWLEDGE NODE</p>
          <h1>{node.title}</h1>
          <p>{node.question}</p>
        </header>
        <section className="knowledge-node-definition">
          <article>
            <span>它帮助你理解什么</span>
            <p>{node.explanation}</p>
          </article>
          <article>
            <CircleAlert aria-hidden="true" />
            <span>它不能单独证明什么</span>
            <p>{node.boundary}</p>
          </article>
        </section>
        <section className="knowledge-node-relations">
          <header>
            <p className="eyebrow">WHERE IT IS USED</p>
            <h2>在真实问题和课程中的位置</h2>
          </header>
          <div>
            {relations.map((relation) => {
              const topic = answerTopics.find(
                (item) => item.slug === relation.pathSlug,
              );
              const academic = getUniversityCourse(relation.course.slug);
              return (
                <article
                  key={`${relation.pathSlug}-${relation.course.slug}`}
                >
                  <span>
                    {relation.course.practiceCredits > 0
                      ? "正式实践关系"
                      : "知识关系"}
                  </span>
                  <h3>{topic?.title ?? relation.pathSlug}</h3>
                  <p>{relation.course.role}</p>
                  <footer>
                    <Link href={`/answers/${relation.pathSlug}`}>
                      进入问题
                      <ArrowRight aria-hidden="true" size={13} />
                    </Link>
                    <Link href={`/courses/${relation.course.slug}`}>
                      {academic?.course.title ?? relation.course.slug}
                    </Link>
                  </footer>
                </article>
              );
            })}
          </div>
        </section>
      </article>
    </ProductShell>
  );
}

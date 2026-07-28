import Link from "next/link";
import { ArrowRight, FileCheck2 } from "lucide-react";
import { answerTopics } from "@/lib/content/answer-paths";
import {
  KNOWLEDGE_GRAPH_VERSION,
  resultRelationsForProgram,
} from "@/lib/content/result-knowledge-graph";

export function ProgramResultMap({ programSlug }: { programSlug: string }) {
  const relations = resultRelationsForProgram(programSlug);
  if (!relations.length) return null;

  return (
    <section className="program-result-map">
      <header className="university-section-heading compact">
        <div>
          <p className="eyebrow">CAPABILITY ↔ REAL RESULT</p>
          <h2>这个专业如何被现实成果证明</h2>
        </div>
        <p>
          专业能力不会只写在成绩单上。以下成果能留下行动、作品、审阅与现实结果的完整来源。
        </p>
      </header>
      <div>
        {relations.map((relation) => {
          const topic = answerTopics.find(
            (item) => item.slug === relation.pathSlug,
          );
          return (
            <article key={relation.pathSlug}>
              <FileCheck2 aria-hidden="true" />
              <div>
                <span>{relation.program.capability}</span>
                <h3>{relation.program.resultUse}</h3>
                <p>{topic?.title ?? relation.pathSlug}</p>
              </div>
              <dl>
                <div>
                  <dt>留下的证明</dt>
                  <dd>行动、原始证据、作品版本、量规审阅、现实结果</dd>
                </div>
                <div>
                  <dt>可连接课程</dt>
                  <dd>
                    {relation.courses
                      .filter((course) => course.practiceCredits > 0)
                      .map((course) => `${course.practiceCredits} 学分实践`)
                      .join("、") || "知识关系已建立，尚不写入学分"}
                  </dd>
                </div>
              </dl>
              <Link href={`/answers/${relation.pathSlug}`}>
                查看公开标准
                <ArrowRight aria-hidden="true" size={14} />
              </Link>
            </article>
          );
        })}
      </div>
      <footer>
        关系图版本 {KNOWLEDGE_GRAPH_VERSION}。路径成果只能证明明确列出的能力，
        不能替代专业中的理论基础、差异内容与期末检验。
      </footer>
    </section>
  );
}

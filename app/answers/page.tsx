import Link from "next/link";
import { ArrowRight, CircleDotDashed } from "lucide-react";
import { AnalyticsSignal } from "@/components/analytics/AnalyticsSignal";
import { ProductShell } from "@/components/shared/ProductShell";
import {
  ANSWER_CONTENT_VERSION,
  ANSWER_EVALUATION_VERSION,
  answerTopicsForStage,
  creationStages,
} from "@/lib/content/answer-paths";

export default function AnswerMapPage() {
  return (
    <ProductShell active="answers" context="30 个核心问题" title="答案地图">
      <AnalyticsSignal
        eventName="answer_map_viewed"
        properties={{
          pathVersion: ANSWER_CONTENT_VERSION,
          contentVersion: ANSWER_CONTENT_VERSION,
          evaluationVersion: ANSWER_EVALUATION_VERSION,
        }}
      />
      <section className="answer-map-page">
        <header className="answer-map-hero">
          <p className="eyebrow">ANSWER ATLAS · VERSION 01</p>
          <div>
            <h1>从问题出发，穿过必要的学科。</h1>
            <p>
              这张地图按创造进程组织，而不是按课程目录组织。
              选择最接近你当前处境的问题，先看判断、产物和证据要求，
              再决定是否进入一条路径。
            </p>
          </div>
        </header>

        <div className="answer-map-legend" aria-label="内容状态说明">
          <span>
            <i data-status="flagship-building" />
            旗舰路径 · 编制中
          </span>
          <span>
            <i data-status="question-index" />
            问题索引
          </span>
          <p>未完成的路径没有“开始”按钮，也不会计入正式开放内容。</p>
        </div>

        <div className="answer-map-grid">
          {creationStages.map((stage) => (
            <section className="answer-stage" key={stage.slug}>
              <header>
                <span>{stage.index}</span>
                <div>
                  <h2>{stage.name}</h2>
                  <p>{stage.description}</p>
                </div>
              </header>
              <div>
                {answerTopicsForStage(stage.slug).map((topic) => (
                  <Link
                    className="answer-topic-card"
                    data-status={topic.status}
                    href={`/answers/${topic.slug}`}
                    key={topic.slug}
                  >
                    <div>
                      <span>{topic.capabilityDomain}</span>
                      <i>
                        {topic.flagship ? "旗舰 · 编制中" : "问题索引"}
                      </i>
                    </div>
                    <h3>{topic.title}</h3>
                    <p>{topic.initialConclusion}</p>
                    <dl>
                      <div>
                        <dt>预计</dt>
                        <dd>{topic.duration}</dd>
                      </div>
                      <div>
                        <dt>产物</dt>
                        <dd>{topic.artifact}</dd>
                      </div>
                    </dl>
                    <footer>
                      <span>{topic.disciplines.slice(0, 2).join(" · ")}</span>
                      <ArrowRight aria-hidden="true" size={15} />
                    </footer>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="answer-map-footnote">
          <CircleDotDashed aria-hidden="true" />
          <div>
            <strong>地图不是一张完成清单。</strong>
            <p>
              推荐顺序会根据你的阶段、证据和能力缺口变化。
              页面浏览与对话轮数都不代表问题已经解决。
            </p>
          </div>
        </footer>
      </section>
    </ProductShell>
  );
}

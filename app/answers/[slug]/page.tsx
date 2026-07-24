import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CircleAlert,
  FileCheck2,
} from "lucide-react";
import { AnalyticsSignal } from "@/components/analytics/AnalyticsSignal";
import { TrackedKnowledgeLink } from "@/components/analytics/TrackedKnowledgeLink";
import { AnswerPathWorkspace } from "@/components/features/answers/AnswerPathWorkspace";
import { ProductShell } from "@/components/shared/ProductShell";
import {
  ANSWER_CONTENT_VERSION,
  ANSWER_EVALUATION_VERSION,
  answerTopics,
  creationStages,
  getAnswerTopic,
} from "@/lib/content/answer-paths";

export function generateStaticParams() {
  return answerTopics.map((topic) => ({ slug: topic.slug }));
}

export default async function AnswerPathPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = getAnswerTopic(slug);
  if (!topic) notFound();
  const stage = creationStages.find((item) => item.slug === topic.stage)!;

  return (
    <ProductShell active="answers" context={stage.name} title="答案路径">
      <AnalyticsSignal
        eventName="answer_path_viewed"
        properties={{
          answerPathSlug: topic.slug,
          pathVersion: topic.version,
          contentVersion: ANSWER_CONTENT_VERSION,
          evaluationVersion: ANSWER_EVALUATION_VERSION,
          status: topic.status,
        }}
      />
      <article className="answer-path-page">
        <nav className="answer-path-breadcrumb" aria-label="面包屑">
          <Link href="/answers">
            <ArrowLeft aria-hidden="true" size={15} />
            答案地图
          </Link>
          <span>{stage.index}</span>
          <strong>{stage.name}</strong>
        </nav>

        <header className="answer-path-hero">
          <div>
            <p className="eyebrow">
              {topic.status === "flagship-open"
                ? "FORMAL PATH · OPEN"
                : topic.flagship
                  ? "FLAGSHIP PATH · BUILDING"
                  : "QUESTION INDEX"}
            </p>
            <h1>{topic.title}</h1>
            <p className="answer-first">
              <span>先给结论</span>
              {topic.initialConclusion}
            </p>
          </div>
          <aside>
            <span>内容状态</span>
            <strong>
              {topic.status === "flagship-open"
                ? "正式路径 · 已开放"
                : topic.flagship
                  ? "旗舰路径 · 编制中"
                  : "问题索引"}
            </strong>
            <dl>
              <div>
                <dt>预计时间</dt>
                <dd>{topic.duration}</dd>
              </div>
              <div>
                <dt>预期产物</dt>
                <dd>{topic.artifact}</dd>
              </div>
              <div>
                <dt>主要能力</dt>
                <dd>{topic.capabilityDomain}</dd>
              </div>
            </dl>
          </aside>
        </header>

        {topic.preview ? (
          <>
            <section className="answer-path-section split">
              <div>
                <p className="eyebrow">WHY IT IS MISJUDGED</p>
                <h2>这个问题为什么容易被误判</h2>
                <p>{topic.preview.whyMisjudged}</p>
              </div>
              <div className="misconception-list">
                <span>常见误区</span>
                {topic.preview.misconceptions.map((item, index) => (
                  <p key={item}>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    {item}
                  </p>
                ))}
              </div>
            </section>

            <section className="answer-action-frame">
              <header>
                <FileCheck2 aria-hidden="true" />
                <div>
                  <p className="eyebrow">ACTION & EVIDENCE</p>
                  <h2>完成取决于行动和证据，不取决于对话轮数。</h2>
                </div>
              </header>
              <div>
                <article>
                  <span>需要你亲自完成</span>
                  <p>{topic.preview.requiredAction}</p>
                </article>
                <article>
                  <span>需要提交的证据</span>
                  <p>{topic.preview.evidence}</p>
                </article>
                <article>
                  <span>可能形成的决定</span>
                  <p>{topic.preview.decision}</p>
                </article>
              </div>
              <footer>
                <CircleAlert aria-hidden="true" />
                <p>
                  <strong>方法边界</strong>
                  {topic.preview.boundary}
                </p>
              </footer>
            </section>
          </>
        ) : (
          <section className="answer-path-hold">
            <CircleAlert aria-hidden="true" />
            <div>
              <p className="eyebrow">EDITORIAL STATUS</p>
              <h2>这条路径尚未正式开放。</h2>
              <p>
                当前只公开问题、初步结论、预期产物与学科关系。
                在行动步骤、证据标准、评价量规和修订机制完成审核前，
                它不会被包装成一门可以完成的课程。
              </p>
            </div>
          </section>
        )}

        {topic.status === "flagship-open" && (
          <AnswerPathWorkspace slug={topic.slug} />
        )}

        <section className="answer-knowledge-links">
          <header>
            <p className="eyebrow">KNOWLEDGE LINKS</p>
            <h2>这条路径会调用哪些学科</h2>
            <p>
              问题决定调用顺序。学院保留方法传统，课程提供必要训练，
              但没有单一专业能够替你完成全部判断。
            </p>
          </header>
          <div>
            {topic.knowledgeLinks.map((link) => {
              const href = link.courseSlug
                ? `/courses/${link.courseSlug}`
                : link.programSlug
                  ? `/programs/${link.programSlug}`
                  : `/college/${link.schoolSlug}`;
              return (
                <TrackedKnowledgeLink
                  contentVersion={ANSWER_CONTENT_VERSION}
                  evaluationVersion={ANSWER_EVALUATION_VERSION}
                  href={href}
                  key={`${link.schoolSlug}-${link.courseSlug ?? ""}`}
                  label={link.label}
                  pathSlug={topic.slug}
                  pathVersion={topic.version}
                  reason={link.reason}
                  targetType={link.courseSlug ? "课程与学院" : "学院与专业"}
                />
              );
            })}
          </div>
        </section>

        <section className="answer-path-status">
          <div>
            <span>路径版本</span>
            <strong>{topic.version}</strong>
          </div>
          <div>
            <span>评价版本</span>
            <strong>{ANSWER_EVALUATION_VERSION}</strong>
          </div>
          <p>
            {topic.status === "flagship-open"
              ? "这条路径已正式开放。完成必须包含现实行动、可追溯证据、Agent 审阅、必要修订与结果回访。"
              : topic.flagship
                ? "编制完成前不开放报名。行动步骤、证据标准与评价量规仍在审核。"
                : "该问题已进入编辑索引，尚未进入旗舰路径的正式编制。"}
          </p>
        </section>
      </article>
    </ProductShell>
  );
}

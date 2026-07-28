import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import { AnalyticsSignal } from "@/components/analytics/AnalyticsSignal";
import { getFormalAnswerPath } from "@/lib/domain/answer-path";
import { getRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function PublicArtifactProofPage({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}) {
  const { shareSlug } = await params;
  const proof = await getRepository().getPublicArtifactProof(shareSlug);
  if (!proof) notFound();
  const config = getFormalAnswerPath(proof.enrollment.pathSlug);
  const total = Object.values(proof.evaluation.scoreDetail).reduce(
    (sum, score) => sum + score,
    0,
  );

  return (
    <main className="public-proof">
      <AnalyticsSignal
        eventName="artifact_share_viewed"
        properties={{
          publicSlug: proof.share.publicSlug,
          answerPathSlug: proof.enrollment.pathSlug,
          artifactVersion: proof.artifact.version,
        }}
      />
      <header className="public-proof-masthead">
        <Link href="/">Academia</Link>
        <span>
          <ShieldCheck aria-hidden="true" />
          可验证作品证明
        </span>
      </header>
      <article className="public-proof-sheet">
        <header>
          <p className="eyebrow">VERIFIED ARTIFACT · PUBLIC RECORD</p>
          <h1>{proof.share.shareTitle}</h1>
          <p>{proof.share.shareSummary}</p>
          <dl>
            <div>
              <dt>答案路径</dt>
              <dd>{config?.title ?? proof.enrollment.pathSlug}</dd>
            </div>
            <div>
              <dt>作品版本</dt>
              <dd>v{proof.artifact.version}</dd>
            </div>
            <div>
              <dt>审阅结果</dt>
              <dd>
                <CheckCircle2 aria-hidden="true" />
                通过 · {total}/24
              </dd>
            </div>
            <div>
              <dt>量规版本</dt>
              <dd>{proof.evaluation.rubricVersion}</dd>
            </div>
          </dl>
        </header>

        <section>
          <p className="eyebrow">THE ARTIFACT</p>
          <h2>{proof.artifact.title}</h2>
          <div className="proof-content">{proof.artifact.content}</div>
        </section>

        <section className="proof-contribution">
          <article>
            <span>学习者完成</span>
            <p>{proof.artifact.userContribution}</p>
          </article>
          <article>
            <span>Agent 协助</span>
            <p>{proof.artifact.agentContribution}</p>
          </article>
        </section>

        <section className="proof-review">
          <div>
            <p className="eyebrow">REVIEW TRACE</p>
            <h2>审阅留下了什么判断</h2>
          </div>
          <dl>
            <div>
              <dt>成立之处</dt>
              <dd>{proof.evaluation.strengths}</dd>
            </div>
            <div>
              <dt>证据边界</dt>
              <dd>{proof.evaluation.weaknesses}</dd>
            </div>
          </dl>
        </section>

        {proof.outcome && (
          <section className="proof-outcome">
            <p className="eyebrow">REAL-WORLD OUTCOME</p>
            <h2>作品进入现实之后</h2>
            <p>{proof.outcome.observedResult}</p>
            <small>
              结果发生于{" "}
              {new Date(proof.outcome.happenedAt).toLocaleDateString("zh-CN")}
            </small>
          </section>
        )}

        <footer>
          <p>
            该页面只公开学习者主动发布的作品、贡献边界与审阅结果；
            原始访谈、私密来源和账户信息不会公开。
          </p>
          <Link href={`/answers/${proof.enrollment.pathSlug}`}>
            查看该路径的公开标准
            <ExternalLink aria-hidden="true" size={15} />
          </Link>
        </footer>
      </article>
    </main>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  CircleDashed,
  FileSearch,
  LockKeyhole,
  Plus,
} from "lucide-react";
import {
  completionProgress,
  formalAnswerPathConfigs,
  getFormalAnswerPath,
  type FormalAnswerPathConfig,
} from "@/lib/domain/answer-path";
import type { AnswerPathSnapshot } from "@/lib/repositories/types";

type ApiPayload<T> = {
  data?: T;
  error?: { code?: string; message?: string };
};

async function api<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const payload = (await response.json()) as ApiPayload<T>;
  if (!response.ok) {
    const error = new Error(payload.error?.message || "操作没有完成") as Error & {
      code?: string;
    };
    error.code = payload.error?.code;
    throw error;
  }
  return payload.data as T;
}

const decisionLabels: Record<string, string> = {
  continue: "继续验证",
  narrow: "缩小问题",
  change: "改变对象或方向",
  stop: "停止投入",
};

export function AnswerPathWorkspace({ slug }: { slug: string }) {
  const pathConfig = getFormalAnswerPath(slug) ?? formalAnswerPathConfigs[0];
  const endpoint = `/api/answer-paths/${slug}`;
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const {
    data: snapshot = null,
    error: loadError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["answer-path", slug],
    queryFn: () => api<AnswerPathSnapshot | null>(endpoint),
    retry: false,
  });

  const latestArtifact = snapshot?.artifacts.at(-1) ?? null;
  const latestEvaluation = snapshot?.evaluations.at(-1) ?? null;
  const latestArtifactReviewed = Boolean(
    latestArtifact &&
      snapshot?.evaluations.some(
        (evaluation) => evaluation.artifactId === latestArtifact.id,
      ),
  );
  const progress = useMemo(
    () =>
      completionProgress({
        hasBaseline: Boolean(snapshot?.baseline),
        evidenceCount: snapshot?.evidence.length ?? 0,
        evidenceMinimum: pathConfig.evidenceMinimum,
        artifactCount: snapshot?.artifacts.length ?? 0,
        reviewCount: snapshot?.evaluations.length ?? 0,
        latestReviewRequiresRevision:
          latestEvaluation?.requiredRevision ?? null,
        hasOutcome: Boolean(snapshot?.outcome),
      }),
    [latestEvaluation, pathConfig.evidenceMinimum, snapshot],
  );

  async function perform(label: string, action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(label);
    setMessage(null);
    try {
      await action();
      await refetch();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作没有完成");
    } finally {
      setBusy(null);
    }
  }

  if (isLoading) {
    return (
      <section className="path-workspace path-workspace-loading">
        <CircleDashed aria-hidden="true" />
        正在读取你的路径记录…
      </section>
    );
  }

  if (
    (loadError as (Error & { code?: string }) | null)?.code ===
    "UNAUTHORIZED"
  ) {
    return (
      <section className="path-workspace path-entry-gate" id="start-path">
        <LockKeyhole aria-hidden="true" />
        <div>
          <p className="eyebrow">YOUR WORK MUST PERSIST</p>
          <h2>先建立学籍，再让证据持续积累。</h2>
          <p>
            这条路径包含现实行动、证据、作品、Agent
            评价与必要修订，它们都会持续保存在你的学籍中。
          </p>
          <Link
            className="button button-dark"
            href={`/login?mode=register&continue=${encodeURIComponent(
              `/answers/${slug}#start-path`,
            )}`}
          >
            建立学籍并开始
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="path-workspace path-entry-gate" id="start-path">
        <FileSearch aria-hidden="true" />
        <div>
          <p className="eyebrow">PATH UNAVAILABLE</p>
          <h2>路径记录暂时没有读取成功。</h2>
          <p>{loadError.message}</p>
          <button className="button button-outline" onClick={() => void refetch()} type="button">
            重新读取
          </button>
        </div>
      </section>
    );
  }

  if (!snapshot) {
    return (
      <section className="path-workspace path-entry-gate" id="start-path">
        <FileSearch aria-hidden="true" />
        <div>
          <p className="eyebrow">FORMAL PATH · V1.2</p>
          <h2>{pathConfig.entryTitle}</h2>
          <p>{pathConfig.entryDescription}</p>
          <button
            className="button button-dark"
            disabled={Boolean(busy)}
            onClick={() =>
              void perform("start", () =>
                api(endpoint, {
                  method: "POST",
                }),
              )
            }
            type="button"
          >
            {busy === "start" ? "正在建立路径…" : "开始这条路径"}
            <ArrowRight aria-hidden="true" size={17} />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="path-workspace" id="start-path">
      <header className="path-workspace-header">
        <div>
          <p className="eyebrow">YOUR FIELD PATH</p>
          <h2>
            {snapshot.baseline?.projectTitle ?? pathConfig.title}
          </h2>
          <p>完成只由证据、评价、修订和现实结果决定。</p>
        </div>
        <div className="path-progress-seal" aria-label={`路径进度 ${progress}%`}>
          <strong>{progress}</strong>
          <span>%</span>
        </div>
      </header>

      <ol className="path-step-rail">
        {pathConfig.steps.map((step) => {
          const completed =
            (step.key === "baseline" && Boolean(snapshot.baseline)) ||
            (step.key === "action" && snapshot.evidence.length > 0) ||
            (step.key === "evidence" &&
              snapshot.evidence.length >= pathConfig.evidenceMinimum) ||
            (step.key === "artifact" && snapshot.artifacts.length > 0) ||
            (step.key === "review" && snapshot.evaluations.length > 0) ||
            (step.key === "revision" &&
              snapshot.artifacts.length > 1) ||
            (step.key === "outcome" && Boolean(snapshot.outcome));
          return (
            <li data-complete={completed} key={step.key}>
              <span>{completed ? <Check aria-hidden="true" /> : step.index}</span>
              <div>
                <strong>{step.title}</strong>
                <small>{step.description}</small>
              </div>
            </li>
          );
        })}
      </ol>

      {message && <div className="path-message" role="status">{message}</div>}

      {!snapshot.baseline && (
        <BaselineForm
          config={pathConfig}
          busy={busy === "baseline"}
          onSubmit={(payload) =>
            perform("baseline", () =>
              api(`${endpoint}/baseline`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
              }),
            )
          }
        />
      )}

      {snapshot.baseline && (
        <>
          <EvidenceLedger
            config={pathConfig}
            busy={busy === "evidence"}
            evidence={snapshot.evidence}
            onSubmit={(payload) =>
              perform("evidence", () =>
                api(`${endpoint}/evidence`, {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify(payload),
                }),
              )
            }
          />

          {snapshot.evidence.length >=
              Math.max(3, pathConfig.evidenceMinimum - 2) &&
            (!latestArtifact ||
              (latestEvaluation?.requiredRevision &&
                latestArtifactReviewed)) && (
              <ArtifactForm
                config={pathConfig}
                busy={busy === "artifact"}
                revision={Boolean(latestArtifact)}
                previous={latestArtifact?.content}
                onSubmit={(payload) =>
                  perform("artifact", () =>
                    api(`${endpoint}/artifacts`, {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify(payload),
                    }),
                  )
                }
              />
            )}

          {latestArtifact && !latestArtifactReviewed && (
            <section className="path-panel review-call">
              <div>
                <p className="eyebrow">ADVERSARIAL REVIEW</p>
                <h3>让 Agent 站在反方审阅这一版{pathConfig.artifactTitle}。</h3>
                <p>
                  评价基于公开量规。证据不足时，系统会要求修订；
                  Agent 不会替你补写行动、证据或现实结果。
                </p>
              </div>
              <button
                className="button button-dark"
                disabled={Boolean(busy)}
                onClick={() =>
                  void perform("review", () =>
                    api(`${endpoint}/review`, { method: "POST" }),
                  )
                }
                type="button"
              >
                {busy === "review" ? "Agent 正在审阅…" : "提交反方审阅"}
              </button>
            </section>
          )}

          {latestEvaluation && (
            <EvaluationCard
              artifactVersion={
                snapshot.artifacts.find(
                  (item) => item.id === latestEvaluation.artifactId,
                )?.version ?? 1
              }
              evaluation={latestEvaluation}
            />
          )}

          {latestEvaluation && !latestEvaluation.requiredRevision && !snapshot.outcome && (
            <OutcomeForm
              busy={busy === "outcome"}
              onSubmit={(payload) =>
                perform("outcome", () =>
                  api(`${endpoint}/outcome`, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify(payload),
                  }),
                )
              }
            />
          )}

          {snapshot.outcome && (
            <section className="path-complete">
              <span><Check aria-hidden="true" /></span>
              <div>
                <p className="eyebrow">REAL-WORLD OUTCOME RECORDED</p>
                <h3>这条路径已经由现实结果完成。</h3>
                <p>
                  你的决定：{decisionLabels[snapshot.outcome.decision]}。
                  系统已把证据表、审阅、修订与现实结果写入能力记录。
                </p>
                <Link href="/answers">
                  选择下一条问题
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}

function BaselineForm({
  busy,
  config,
  onSubmit,
}: {
  busy: boolean;
  config: FormalAnswerPathConfig;
  onSubmit(payload: Record<string, string | number>): void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      projectTitle: String(form.get("projectTitle") ?? ""),
      ideaSummary: String(form.get("ideaSummary") ?? ""),
      targetUser: String(form.get("targetUser") ?? ""),
      currentEvidence: String(form.get("currentEvidence") ?? ""),
      biggestUncertainty: String(form.get("biggestUncertainty") ?? ""),
      confidence: Number(form.get("confidence") ?? 50),
    });
  }
  return (
    <form className="path-panel path-form" onSubmit={submit}>
      <header>
        <span>01</span>
        <div>
          <p className="eyebrow">BASELINE DIAGNOSIS</p>
          <h3>在寻找答案之前，先留下此刻的判断。</h3>
        </div>
      </header>
      <div className="path-form-grid">
        <label>
          <span>{config.baseline.projectLabel}</span>
          <input name="projectTitle" placeholder={config.baseline.projectPlaceholder} required />
        </label>
        <label>
          <span>{config.baseline.ideaLabel}</span>
          <textarea name="ideaSummary" placeholder={config.baseline.ideaPlaceholder} required />
        </label>
        <label>
          <span>{config.baseline.targetLabel}</span>
          <textarea name="targetUser" placeholder={config.baseline.targetPlaceholder} required />
        </label>
        <label>
          <span>{config.baseline.evidenceLabel}</span>
          <textarea name="currentEvidence" placeholder={config.baseline.evidencePlaceholder} required />
        </label>
        <label>
          <span>{config.baseline.uncertaintyLabel}</span>
          <textarea name="biggestUncertainty" placeholder={config.baseline.uncertaintyPlaceholder} required />
        </label>
        <label className="confidence-field">
          <span>你现在有多大把握？</span>
          <input defaultValue="50" max="100" min="0" name="confidence" type="range" />
          <small>{config.baseline.confidenceHint}</small>
        </label>
      </div>
      <button className="button button-dark" disabled={busy} type="submit">
        {busy ? "正在保存…" : "保存基线，进入现实"}
      </button>
    </form>
  );
}

function EvidenceLedger({
  busy,
  config,
  evidence,
  onSubmit,
}: {
  busy: boolean;
  config: FormalAnswerPathConfig;
  evidence: AnswerPathSnapshot["evidence"];
  onSubmit(payload: Record<string, string>): void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    onSubmit({
      evidenceType: String(data.get("evidenceType") ?? ""),
      subjectLabel: String(data.get("subjectLabel") ?? ""),
      content: String(data.get("content") ?? ""),
      provenance: String(data.get("provenance") ?? ""),
      observedAt: String(data.get("observedAt") ?? ""),
    });
    if (!busy) form.reset();
  }
  return (
    <section className="path-panel evidence-ledger">
      <header>
        <div>
          <p className="eyebrow">FIELD EVIDENCE</p>
          <h3>真实对象与真实行为</h3>
        </div>
        <strong>{evidence.length}<small>/ 至少 {config.evidenceMinimum} 条</small></strong>
      </header>
      {evidence.length > 0 && (
        <div className="evidence-list">
          {evidence.map((item, index) => (
            <article key={item.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <small>{config.evidenceTypes.find((type) => type.value === item.evidenceType)?.label ?? item.evidenceType} · {item.subjectLabel}</small>
                <p>{item.content}</p>
                <em>来源：{item.provenance}</em>
              </div>
            </article>
          ))}
        </div>
      )}
      <form className="evidence-form" onSubmit={submit}>
        <label>
          <span>证据类型</span>
          <select defaultValue={config.evidenceTypes[0].value} name="evidenceType">
            {config.evidenceTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>对象代号</span>
          <input name="subjectLabel" placeholder="例如：受访者 03 / 测试对象 A / 版本 01" required />
        </label>
        <label className="wide">
          <span>你具体观察到什么</span>
          <textarea name="content" placeholder="记录已经发生的动作、原话、版本变化或代价；不要只写总结。" required />
        </label>
        <label>
          <span>来源与保存位置</span>
          <input name="provenance" placeholder="例如：7 月 24 日访谈录音 12:30" required />
        </label>
        <label>
          <span>发生日期</span>
          <input name="observedAt" type="date" />
        </label>
        <button className="button button-outline" disabled={busy} type="submit">
          <Plus aria-hidden="true" size={16} />
          {busy ? "正在保存…" : "加入证据"}
        </button>
      </form>
    </section>
  );
}

function ArtifactForm({
  busy,
  config,
  onSubmit,
  previous,
  revision,
}: {
  busy: boolean;
  config: FormalAnswerPathConfig;
  onSubmit(payload: Record<string, string>): void;
  previous?: string;
  revision: boolean;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({
      title: String(data.get("title") ?? ""),
      content: String(data.get("content") ?? ""),
      userContribution: String(data.get("userContribution") ?? ""),
      agentContribution: String(data.get("agentContribution") ?? ""),
    });
  }
  return (
    <form className="path-panel path-form artifact-form" onSubmit={submit}>
      <header>
        <span>{revision ? "06" : "04"}</span>
        <div>
          <p className="eyebrow">{revision ? "REVISION" : "EVIDENCE ARTIFACT"}</p>
          <h3>{revision ? "依据审阅重新行动并修订。" : `把证据整理成可以被反驳的${config.artifactTitle}。`}</h3>
        </div>
      </header>
      <label>
        <span>{config.artifactTitle}标题</span>
        <input defaultValue={revision ? `${config.artifactTitle}（修订版）` : config.artifactTitle} name="title" required />
      </label>
      <label>
        <span>事实、反例、判断与边界</span>
        <textarea
          defaultValue={previous}
          className="artifact-editor"
          name="content"
          placeholder={config.artifactPrompt}
          required
        />
      </label>
      <div className="contribution-grid">
        <label>
          <span>你亲自完成了什么</span>
          <textarea name="userContribution" placeholder="访谈、观察、判断、取舍和改写都应写清楚。" required />
        </label>
        <label>
          <span>Agent 完成了什么</span>
          <textarea name="agentContribution" placeholder="例如：整理结构、提出反方问题；未使用则写“未使用”。" required />
        </label>
      </div>
      <button className="button button-dark" disabled={busy} type="submit">
        {busy ? "正在保存…" : revision ? "提交修订版" : "提交第一版证据表"}
      </button>
    </form>
  );
}

function EvaluationCard({
  artifactVersion,
  evaluation,
}: {
  artifactVersion: number;
  evaluation: AnswerPathSnapshot["evaluations"][number];
}) {
  return (
    <section className="path-panel evaluation-card" data-result={evaluation.requiredRevision ? "revise" : "pass"}>
      <header>
        <div>
          <p className="eyebrow">AGENT REVIEW · ARTIFACT V{artifactVersion}</p>
          <h3>{evaluation.requiredRevision ? "需要修订" : "通过量规，可以进入结果回访"}</h3>
        </div>
        <strong>{Object.values(evaluation.scoreDetail).reduce((sum, value) => sum + value, 0)}<small>/24</small></strong>
      </header>
      <div className="rubric-scores">
        {Object.entries(evaluation.scoreDetail).map(([key, score]) => (
          <span key={key}><b>{key}</b><i style={{ width: `${score * 25}%` }} /><em>{score}/4</em></span>
        ))}
      </div>
      <p className="evaluation-feedback">{evaluation.feedback}</p>
      <dl>
        <div><dt>结构性优点</dt><dd>{evaluation.strengths}</dd></div>
        <div><dt>阻断性缺口</dt><dd>{evaluation.weaknesses}</dd></div>
      </dl>
    </section>
  );
}

function OutcomeForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit(payload: Record<string, string>): void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({
      decision: String(data.get("decision") ?? ""),
      observedResult: String(data.get("observedResult") ?? ""),
      nextAction: String(data.get("nextAction") ?? ""),
      uncertainty: String(data.get("uncertainty") ?? ""),
      happenedAt: String(data.get("happenedAt") ?? ""),
    });
  }
  return (
    <form className="path-panel path-form outcome-form" onSubmit={submit}>
      <header>
        <span>07</span>
        <div>
          <p className="eyebrow">REAL-WORLD OUTCOME</p>
          <h3>不要以“学完”结束，以现实中发生的变化结束。</h3>
        </div>
      </header>
      <label>
        <span>你最终作出的决定</span>
        <select defaultValue="narrow" name="decision">
          {Object.entries(decisionLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label>
        <span>决定执行后，现实中发生了什么</span>
        <textarea name="observedResult" placeholder="写结果、行为或没有发生的变化，不写预期。" required />
      </label>
      <label>
        <span>下一步行动</span>
        <textarea name="nextAction" placeholder="只写一个可以被观察的下一步。" required />
      </label>
      <label>
        <span>现在仍然不确定什么</span>
        <textarea name="uncertainty" placeholder="完成路径不等于不确定性消失。" required />
      </label>
      <label>
        <span>结果发生日期</span>
        <input defaultValue={new Date().toISOString().slice(0, 10)} name="happenedAt" required type="date" />
      </label>
      <button className="button button-dark" disabled={busy} type="submit">
        {busy ? "正在写入结果…" : "记录现实结果并完成路径"}
      </button>
    </form>
  );
}

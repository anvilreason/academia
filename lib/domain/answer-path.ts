import type {
  AnswerPathArtifactRecord,
  BaselineDiagnosisRecord,
  EvidenceSubmissionRecord,
} from "@/lib/repositories/types";

export const FALSE_DEMAND_PATH_SLUG = "is-this-a-false-demand";
export const FALSE_DEMAND_PATH_VERSION = "false-demand-v1.1";
export const FALSE_DEMAND_RUBRIC_VERSION = "false-demand-rubric-v1";

export const falseDemandSteps = [
  {
    key: "baseline",
    index: "01",
    title: "写下尚未被证明的判断",
    description: "定义想法、对象、已有依据与最大不确定性。",
  },
  {
    key: "action",
    index: "02",
    title: "进入真实情境",
    description: "访谈至少五位符合条件的人，只追问已经发生的行为。",
  },
  {
    key: "evidence",
    index: "03",
    title: "整理行为与代价",
    description: "保留来源、原话、替代方案和已经付出的真实成本。",
  },
  {
    key: "artifact",
    index: "04",
    title: "形成需求证据表",
    description: "区分事实、解释、反例与仍然不知道的部分。",
  },
  {
    key: "review",
    index: "05",
    title: "接受反方审查",
    description: "Agent 按公开量规评价；证据不足时必须修订。",
  },
  {
    key: "revision",
    index: "06",
    title: "修订，而不是辩护",
    description: "补证据、缩小结论或明确停止，不用措辞掩盖缺口。",
  },
  {
    key: "outcome",
    index: "07",
    title: "让现实留下结果",
    description: "记录继续、缩小、改变或停止后的真实变化。",
  },
] as const;

export type FalseDemandStepKey = (typeof falseDemandSteps)[number]["key"];

export type BaselineInput = Omit<
  BaselineDiagnosisRecord,
  "id" | "enrollmentId" | "userId" | "createdAt" | "updatedAt"
>;

export function validateBaseline(input: BaselineInput) {
  const required: Array<keyof Omit<BaselineInput, "confidence">> = [
    "projectTitle",
    "ideaSummary",
    "targetUser",
    "currentEvidence",
    "biggestUncertainty",
  ];
  const missing = required.filter(
    (key) => input[key].trim().length < (key === "projectTitle" ? 2 : 12),
  );
  if (missing.length) {
    return {
      ok: false as const,
      message: "请把想法、对象、已有依据和最大不确定性写得更具体。",
    };
  }
  if (!Number.isInteger(input.confidence) || input.confidence < 0 || input.confidence > 100) {
    return {
      ok: false as const,
      message: "判断把握应在 0—100 之间。",
    };
  }
  return { ok: true as const };
}

export function validateEvidence(input: {
  evidenceType: string;
  subjectLabel: string;
  content: string;
  provenance: string;
  observedAt?: string | null;
}) {
  if (
    input.subjectLabel.trim().length < 2 ||
    input.content.trim().length < 20 ||
    input.provenance.trim().length < 8
  ) {
    return {
      ok: false as const,
      message: "每条证据都要写明对象、具体行为和可追溯来源。",
    };
  }
  if (!["interview", "behavior", "cost", "counterexample"].includes(input.evidenceType)) {
    return { ok: false as const, message: "证据类型无效。" };
  }
  return { ok: true as const };
}

export function scoreFalseDemandArtifact(input: {
  baseline: BaselineDiagnosisRecord;
  evidence: EvidenceSubmissionRecord[];
  artifact: AnswerPathArtifactRecord;
}) {
  const subjectCount = new Set(
    input.evidence.map((item) => item.subjectLabel.trim().toLowerCase()),
  ).size;
  const hasCost = input.evidence.some((item) => item.evidenceType === "cost");
  const hasCounterexample = input.evidence.some(
    (item) => item.evidenceType === "counterexample",
  );
  const traceableCount = input.evidence.filter(
    (item) => item.provenance.trim().length >= 8,
  ).length;
  const artifactText = input.artifact.content.trim();
  const scores = {
    sampleFit: subjectCount >= 5 ? 4 : subjectCount >= 3 ? 2 : 1,
    behaviorEvidence: input.evidence.length >= 5 ? 4 : input.evidence.length >= 3 ? 2 : 1,
    realCost: hasCost ? 4 : 1,
    counterEvidence: hasCounterexample ? 4 : 1,
    traceability:
      traceableCount >= 5 && artifactText.length >= 280
        ? 4
        : traceableCount >= 3 && artifactText.length >= 180
          ? 2
          : 1,
    uncertainty:
      input.baseline.biggestUncertainty.length >= 20 &&
      /不确定|未知|尚未|不能|证据不足|反例/.test(artifactText)
        ? 4
        : 2,
  };
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const requiredRevision =
    subjectCount < 5 ||
    input.evidence.length < 5 ||
    !hasCost ||
    !hasCounterexample ||
    artifactText.length < 280 ||
    Object.values(scores).some((score) => score < 2);
  const gaps = [
    subjectCount < 5 ? `还缺 ${5 - subjectCount} 位不同对象的证据` : null,
    !hasCost ? "尚未提交任何真实成本证据" : null,
    !hasCounterexample ? "尚未主动寻找反例" : null,
    artifactText.length < 280 ? "需求证据表尚未形成可复核的完整判断" : null,
  ].filter(Boolean) as string[];
  return {
    scores,
    total,
    requiredRevision,
    strengths:
      total >= 18
        ? "已经能把主观判断与现实证据分开，并保留来源。"
        : "已经开始把想法转化为可被检验的假设。",
    weaknesses:
      gaps.join("；") || "目前没有阻断性缺口，但仍应保留结论边界。",
  };
}

export function completionProgress(input: {
  hasBaseline: boolean;
  evidenceCount: number;
  artifactCount: number;
  reviewCount: number;
  latestReviewRequiresRevision: boolean | null;
  hasOutcome: boolean;
}) {
  if (input.hasOutcome) return 100;
  if (input.reviewCount > 0 && input.latestReviewRequiresRevision === false) {
    return 86;
  }
  if (input.reviewCount > 0) return 72;
  if (input.artifactCount > 0) return 58;
  if (input.evidenceCount >= 5) return 44;
  if (input.evidenceCount > 0) return 24 + Math.min(16, input.evidenceCount * 3);
  if (input.hasBaseline) return 18;
  return 0;
}

import type {
  AnswerPathArtifactRecord,
  AnswerPathEnrollmentRecord,
  BaselineDiagnosisRecord,
  EvidenceSubmissionRecord,
} from "@/lib/repositories/types";

export type AnswerPathStepKey =
  | "baseline"
  | "action"
  | "evidence"
  | "artifact"
  | "review"
  | "revision"
  | "outcome";

export type EvidenceTypeDefinition = {
  value: string;
  label: string;
  prompt: string;
};

export type FormalAnswerPathConfig = {
  slug: string;
  title: string;
  pathVersion: string;
  rubricVersion: string;
  capabilityId: string;
  capabilityLabel: string;
  capabilityDomain: string;
  artifactType: string;
  artifactTitle: string;
  artifactPrompt: string;
  artifactMinimum: number;
  evidenceMinimum: number;
  subjectMinimum: number;
  requiredEvidenceTypes: readonly string[];
  evidenceTypes: readonly EvidenceTypeDefinition[];
  entryTitle: string;
  entryDescription: string;
  baseline: {
    projectLabel: string;
    projectPlaceholder: string;
    ideaLabel: string;
    ideaPlaceholder: string;
    targetLabel: string;
    targetPlaceholder: string;
    evidenceLabel: string;
    evidencePlaceholder: string;
    uncertaintyLabel: string;
    uncertaintyPlaceholder: string;
    confidenceHint: string;
  };
  steps: ReadonlyArray<{
    key: AnswerPathStepKey;
    index: string;
    title: string;
    description: string;
  }>;
};

const sharedSteps = (
  actionTitle: string,
  actionDescription: string,
  evidenceTitle: string,
  artifactTitle: string,
): FormalAnswerPathConfig["steps"] => [
  {
    key: "baseline",
    index: "01",
    title: "留下未经验证的判断",
    description: "记录当前处境、已有依据与最关键的不确定性。",
  },
  {
    key: "action",
    index: "02",
    title: actionTitle,
    description: actionDescription,
  },
  {
    key: "evidence",
    index: "03",
    title: evidenceTitle,
    description: "保留原始来源、反例和无法解释的部分。",
  },
  {
    key: "artifact",
    index: "04",
    title: artifactTitle,
    description: "把行动与证据整理成可以被他人复核的第一版作品。",
  },
  {
    key: "review",
    index: "05",
    title: "接受反方审查",
    description: "Agent 按公开量规评价；关键缺口未补足就不能通过。",
  },
  {
    key: "revision",
    index: "06",
    title: "依据证据修订",
    description: "补证据、缩小结论或重新行动，不用措辞掩盖缺口。",
  },
  {
    key: "outcome",
    index: "07",
    title: "让现实留下结果",
    description: "记录作品投入真实情境后发生的变化与下一步。",
  },
];

const commonBaseline = {
  projectLabel: "你正在处理的项目或情境",
  projectPlaceholder: "写下一个真实、具体、正在发生的项目",
  ideaLabel: "你现在的判断是什么",
  ideaPlaceholder: "用自己的话写，不写宣传语或正确答案。",
  targetLabel: "谁会受到这个判断影响",
  targetPlaceholder: "写清具体对象、发生情境与约束。",
  evidenceLabel: "你现在已经掌握什么依据",
  evidencePlaceholder: "区分亲眼看到的事实、听来的说法和自己的推测。",
  uncertaintyLabel: "最可能推翻当前判断的未知是什么",
  uncertaintyPlaceholder: "如果只能验证一件事，你最需要知道什么？",
  confidenceHint: "0 = 只是直觉；100 = 已有多次可追溯的现实结果",
};

export const formalAnswerPathConfigs = [
  {
    slug: "is-this-a-false-demand",
    title: "如何判断一个想法是不是伪需求？",
    pathVersion: "false-demand-v1.2",
    rubricVersion: "false-demand-rubric-v2",
    capabilityId: "evidence_based_demand_judgment",
    capabilityLabel: "以行为与代价判断需求",
    capabilityDomain: "用户与社会",
    artifactType: "demand_evidence_table",
    artifactTitle: "需求证据表",
    artifactPrompt:
      "1. 已观察到的事实\n2. 与判断冲突的反例\n3. 用户已经付出的真实成本\n4. 当前可以下到哪一步的结论\n5. 什么证据会推翻结论\n6. 仍然不知道什么",
    artifactMinimum: 280,
    evidenceMinimum: 5,
    subjectMinimum: 5,
    requiredEvidenceTypes: ["cost", "counterexample"],
    evidenceTypes: [
      { value: "interview", label: "访谈原始记录", prompt: "记录具体原话与发生情境" },
      { value: "behavior", label: "已经发生的行为", prompt: "记录真实动作与替代方案" },
      { value: "cost", label: "真实成本", prompt: "记录钱、时间、风险或放弃" },
      { value: "counterexample", label: "反例", prompt: "记录与当前判断冲突的事实" },
    ],
    entryTitle: "从一个你正在考虑投入的真实想法开始。",
    entryDescription:
      "路径不会替你证明需求。它要求你进入真实情境、保留来源、寻找反例，最后由现实决定继续、改变或停止。",
    baseline: {
      ...commonBaseline,
      projectLabel: "项目或想法的名字",
      projectPlaceholder: "例如：面向独立设计师的报价助手",
      ideaLabel: "你认为它解决了什么问题",
      targetLabel: "具体是谁在什么情境下遇到它",
    },
    steps: sharedSteps(
      "进入真实情境",
      "访谈至少五位符合条件的人，只追问已经发生的行为。",
      "整理行为与代价",
      "形成需求证据表",
    ),
  },
  {
    slug: "non-leading-user-interviews",
    title: "如何进行不诱导答案的用户访谈？",
    pathVersion: "non-leading-interviews-v1.2",
    rubricVersion: "interview-rubric-v1",
    capabilityId: "non_leading_user_research",
    capabilityLabel: "开展非诱导用户研究",
    capabilityDomain: "用户与社会",
    artifactType: "interview_evidence_pack",
    artifactTitle: "访谈证据包",
    artifactPrompt:
      "1. 招募标准与排除条件\n2. 不诱导的提纲\n3. 五次访谈中的原始原话\n4. 追问如何回到过去行为\n5. 与原假设冲突的证据\n6. 访谈不能证明什么",
    artifactMinimum: 320,
    evidenceMinimum: 5,
    subjectMinimum: 5,
    requiredEvidenceTypes: ["interview", "counterexample"],
    evidenceTypes: [
      { value: "interview", label: "逐字访谈片段", prompt: "保留问题、原话和上下文" },
      { value: "behavior", label: "过去行为", prompt: "记录受访者最近一次真实行动" },
      { value: "counterexample", label: "反向证据", prompt: "记录推翻原假设的回答" },
      { value: "reflection", label: "提问反思", prompt: "指出一次可能诱导答案的提问并改写" },
    ],
    entryTitle: "带着一份真实的访谈任务进入现场。",
    entryDescription:
      "你会亲自招募、提问和保留原始记录。Agent 只负责检查诱导、追问证据和整理结构。",
    baseline: {
      ...commonBaseline,
      projectLabel: "这次访谈服务于哪个项目",
      ideaLabel: "你希望通过访谈判断什么",
      targetLabel: "受访者必须符合哪些招募条件",
      evidenceLabel: "此前有哪些关于这群人的信息",
      uncertaintyLabel: "你最担心哪一个问题会诱导答案",
    },
    steps: sharedSteps(
      "完成五次非诱导访谈",
      "只问过去行为，保留提问、原话与上下文。",
      "标记原话、行为与反证",
      "形成访谈证据包",
    ),
  },
  {
    slug: "course-to-portfolio",
    title: "如何把一门课程变成可展示的作品？",
    pathVersion: "course-to-portfolio-v1.2",
    rubricVersion: "portfolio-rubric-v1",
    capabilityId: "knowledge_to_public_artifact",
    capabilityLabel: "把知识转化为可验证作品",
    capabilityDomain: "表达、协作与组织",
    artifactType: "portfolio_case",
    artifactTitle: "课程作品案例",
    artifactPrompt:
      "1. 真实问题与对象\n2. 课程知识如何被调用\n3. 你的关键判断与取舍\n4. 初稿和外部反馈\n5. 修订前后发生了什么变化\n6. 来源、贡献边界与尚未证明的能力",
    artifactMinimum: 360,
    evidenceMinimum: 4,
    subjectMinimum: 2,
    requiredEvidenceTypes: ["deliverable", "feedback", "revision"],
    evidenceTypes: [
      { value: "source", label: "课程与外部来源", prompt: "记录被实际调用的知识" },
      { value: "deliverable", label: "初稿或作品", prompt: "提供版本与保存位置" },
      { value: "feedback", label: "外部反馈", prompt: "保留他人的原话与身份关系" },
      { value: "revision", label: "修订证据", prompt: "说明根据证据改变了什么" },
    ],
    entryTitle: "选择一门你已经学过、但还没有留下作品的课程。",
    entryDescription:
      "这条路径不把笔记重新排版成作品。你要用课程知识处理真实问题，并展示证据、取舍与修订。",
    baseline: {
      ...commonBaseline,
      projectLabel: "要转化为作品的课程或训练",
      ideaLabel: "你打算用它解决哪个真实问题",
      targetLabel: "谁会阅读、使用或评价这件作品",
      evidenceLabel: "现在已有的材料、作业或实践是什么",
      uncertaintyLabel: "这件作品最需要证明哪项能力",
    },
    steps: sharedSteps(
      "做出可被使用的初稿",
      "选择真实对象，完成初稿并邀请外部反馈。",
      "保留来源、反馈与版本",
      "形成课程作品案例",
    ),
  },
  {
    slug: "first-prototype-scope",
    title: "第一个原型应该做到什么程度？",
    pathVersion: "first-prototype-v1.2",
    rubricVersion: "prototype-rubric-v1",
    capabilityId: "uncertainty_driven_prototyping",
    capabilityLabel: "围绕最大不确定性设计原型",
    capabilityDomain: "产品与设计",
    artifactType: "prototype_test_report",
    artifactTitle: "原型测试报告",
    artifactPrompt:
      "1. 当前最大不确定性\n2. 原型明确不做什么\n3. 测试任务与成功／失败标准\n4. 真实对象的行为记录\n5. 失败点与反例\n6. 下一版只改变什么",
    artifactMinimum: 300,
    evidenceMinimum: 4,
    subjectMinimum: 2,
    requiredEvidenceTypes: ["prototype", "prototype_test"],
    evidenceTypes: [
      { value: "hypothesis", label: "待验证假设", prompt: "写明成功、失败与停止条件" },
      { value: "prototype", label: "原型版本", prompt: "记录范围、链接或保存位置" },
      { value: "prototype_test", label: "任务测试", prompt: "记录对象的动作、停顿和失败" },
      { value: "counterexample", label: "边界与反例", prompt: "记录原型无法回答的问题" },
    ],
    entryTitle: "从一个尚未被验证的关键假设开始，而不是从功能列表开始。",
    entryDescription:
      "你会删掉不能帮助学习的部分，做出足以进入真实测试的最小原型，并明确它不能证明什么。",
    baseline: {
      ...commonBaseline,
      projectLabel: "这个原型属于哪个真实项目",
      ideaLabel: "你想用原型验证的核心假设",
      targetLabel: "谁会在什么任务中使用它",
      evidenceLabel: "此前已有的研究、草图或失败是什么",
      uncertaintyLabel: "当前最大且可被原型检验的不确定性",
    },
    steps: sharedSteps(
      "制作并投放最小原型",
      "只保留能检验最大不确定性的部分，让真实对象完成任务。",
      "记录行为、失败与边界",
      "形成原型测试报告",
    ),
  },
  {
    slug: "liking-without-paying",
    title: "为什么用户说喜欢，却不愿意付出成本？",
    pathVersion: "liking-without-paying-v1.2",
    rubricVersion: "commitment-rubric-v1",
    capabilityId: "commitment_evidence_design",
    capabilityLabel: "用真实承诺检验价值",
    capabilityDomain: "商业与财务",
    artifactType: "commitment_experiment_report",
    artifactTitle: "真实成本实验报告",
    artifactPrompt:
      "1. 口头喜欢与真实行为的差距\n2. 被要求付出的具体成本\n3. 实验对象、伦理边界和通过标准\n4. 发生与没有发生的承诺\n5. 购买权限、预算和替代方案\n6. 对人群、方案、价格或渠道的判断",
    artifactMinimum: 320,
    evidenceMinimum: 5,
    subjectMinimum: 5,
    requiredEvidenceTypes: ["cost", "commitment", "counterexample"],
    evidenceTypes: [
      { value: "interview", label: "非诱导访谈", prompt: "记录过去行为与约束" },
      { value: "cost", label: "既有真实成本", prompt: "记录已付的钱、时间、数据或改变" },
      { value: "commitment", label: "承诺实验", prompt: "记录对方是否真正付出成本" },
      { value: "counterexample", label: "拒绝与反例", prompt: "记录喜欢但没有行动的原因" },
    ],
    entryTitle: "选择一个已经获得口头认可、却没有真实行动的方案。",
    entryDescription:
      "这条路径不把付款当成唯一证据，但要求设计一次合乎伦理、需要真实承诺的验证。",
    baseline: {
      ...commonBaseline,
      projectLabel: "正在获得口头认可的项目",
      ideaLabel: "用户说喜欢什么、你据此作了什么判断",
      targetLabel: "谁拥有使用、购买或批准的真实权限",
      evidenceLabel: "现在有哪些喜欢、拒绝与替代行为的记录",
      uncertaintyLabel: "你还不知道哪一种成本阻止了行动",
    },
    steps: sharedSteps(
      "设计真实承诺实验",
      "让符合条件的人付出钱、时间、数据、风险或改变习惯。",
      "对照喜欢与真实承诺",
      "形成真实成本实验报告",
    ),
  },
  {
    slug: "continue-pivot-or-stop",
    title: "应该继续、调整还是停止一个项目？",
    pathVersion: "continue-pivot-stop-v1.2",
    rubricVersion: "project-decision-rubric-v1",
    capabilityId: "evidence_based_project_decision",
    capabilityLabel: "依据证据作出项目取舍",
    capabilityDomain: "商业与财务",
    artifactType: "project_decision_memo",
    artifactTitle: "项目取舍备忘录",
    artifactPrompt:
      "1. 关键假设与预先定义的门槛\n2. 支持继续的证据\n3. 支持调整或停止的证据\n4. 现金、时间与机会成本\n5. 反方审查的核心意见\n6. 决定、触发条件与下一次复盘日期",
    artifactMinimum: 340,
    evidenceMinimum: 5,
    subjectMinimum: 3,
    requiredEvidenceTypes: ["milestone", "constraint", "counterexample"],
    evidenceTypes: [
      { value: "milestone", label: "里程碑结果", prompt: "对照预先标准记录结果" },
      { value: "behavior", label: "用户或市场行为", prompt: "记录真实行动而非态度" },
      { value: "constraint", label: "资源与机会成本", prompt: "记录现金、时间和被放弃的选择" },
      { value: "counterexample", label: "反方证据", prompt: "记录反对继续的事实或审查意见" },
    ],
    entryTitle: "带着一个真实投入中的项目，以及继续与停止都不舒服的时刻开始。",
    entryDescription:
      "你会把证据、资源余量和机会成本放在同一张判断图中，让沉没成本失去投票权。",
    baseline: {
      ...commonBaseline,
      projectLabel: "需要作出取舍的项目",
      ideaLabel: "你当前倾向继续、调整还是停止，为什么",
      targetLabel: "谁会受到这个决定影响",
      evidenceLabel: "已有里程碑、正反证据与资源余量",
      uncertaintyLabel: "哪一条新信息最可能改变决定",
    },
    steps: sharedSteps(
      "完成反方审查与资源盘点",
      "整理里程碑、正反证据、现金时间约束与机会成本。",
      "对照门槛与停止标准",
      "形成项目取舍备忘录",
    ),
  },
] as const satisfies readonly FormalAnswerPathConfig[];

export type FormalAnswerPathSlug =
  (typeof formalAnswerPathConfigs)[number]["slug"];

export function getFormalAnswerPath(slug: string) {
  return formalAnswerPathConfigs.find((path) => path.slug === slug) ?? null;
}

export const FALSE_DEMAND_PATH_SLUG = "is-this-a-false-demand";
export const FALSE_DEMAND_PATH_VERSION =
  formalAnswerPathConfigs[0].pathVersion;
export const FALSE_DEMAND_RUBRIC_VERSION =
  formalAnswerPathConfigs[0].rubricVersion;
export const falseDemandSteps = formalAnswerPathConfigs[0].steps;
export type FalseDemandStepKey = AnswerPathStepKey;

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
      message: "请把项目、对象、已有依据和最大不确定性写得更具体。",
    };
  }
  if (
    !Number.isInteger(input.confidence) ||
    input.confidence < 0 ||
    input.confidence > 100
  ) {
    return { ok: false as const, message: "判断把握应在 0—100 之间。" };
  }
  return { ok: true as const };
}

export function validateEvidence(
  input: {
    evidenceType: string;
    subjectLabel: string;
    content: string;
    provenance: string;
    observedAt?: string | null;
  },
  config: FormalAnswerPathConfig = formalAnswerPathConfigs[0],
) {
  if (
    input.subjectLabel.trim().length < 2 ||
    input.content.trim().length < 20 ||
    input.provenance.trim().length < 8
  ) {
    return {
      ok: false as const,
      message: "每条证据都要写明对象、具体观察和可追溯来源。",
    };
  }
  if (!config.evidenceTypes.some((item) => item.value === input.evidenceType)) {
    return { ok: false as const, message: "证据类型无效。" };
  }
  return { ok: true as const };
}

export function scoreAnswerPathArtifact(
  config: FormalAnswerPathConfig,
  input: {
    baseline: BaselineDiagnosisRecord;
    evidence: EvidenceSubmissionRecord[];
    artifact: AnswerPathArtifactRecord;
  },
) {
  const subjectCount = new Set(
    input.evidence.map((item) => item.subjectLabel.trim().toLowerCase()),
  ).size;
  const requiredCoverage = config.requiredEvidenceTypes.filter((type) =>
    input.evidence.some((item) => item.evidenceType === type),
  ).length;
  const traceableCount = input.evidence.filter(
    (item) => item.provenance.trim().length >= 8,
  ).length;
  const artifactText = input.artifact.content.trim();
  const scores = {
    actionCoverage:
      subjectCount >= config.subjectMinimum
        ? 4
        : subjectCount >= Math.max(1, config.subjectMinimum - 2)
          ? 2
          : 1,
    evidenceDepth:
      input.evidence.length >= config.evidenceMinimum
        ? 4
        : input.evidence.length >= Math.max(2, config.evidenceMinimum - 2)
          ? 2
          : 1,
    requiredEvidence:
      requiredCoverage === config.requiredEvidenceTypes.length
        ? 4
        : requiredCoverage > 0
          ? 2
          : 1,
    counterEvidence: input.evidence.some(
      (item) =>
        item.evidenceType === "counterexample" ||
        item.evidenceType === "reflection" ||
        /反例|失败|拒绝|冲突|不能证明/.test(item.content),
    )
      ? 4
      : 1,
    traceability:
      traceableCount >= config.evidenceMinimum &&
      artifactText.length >= config.artifactMinimum
        ? 4
        : traceableCount >= Math.max(2, config.evidenceMinimum - 2) &&
            artifactText.length >= Math.round(config.artifactMinimum * 0.65)
          ? 2
          : 1,
    uncertainty:
      input.baseline.biggestUncertainty.length >= 20 &&
      /不确定|未知|尚未|不能|证据不足|反例|边界|失败/.test(artifactText)
        ? 4
        : 2,
  };
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const missingTypes = config.requiredEvidenceTypes.filter(
    (type) => !input.evidence.some((item) => item.evidenceType === type),
  );
  const requiredRevision =
    subjectCount < config.subjectMinimum ||
    input.evidence.length < config.evidenceMinimum ||
    missingTypes.length > 0 ||
    artifactText.length < config.artifactMinimum ||
    Object.values(scores).some((score) => score < 2);
  const gaps = [
    subjectCount < config.subjectMinimum
      ? `还缺 ${config.subjectMinimum - subjectCount} 个不同对象或来源`
      : null,
    input.evidence.length < config.evidenceMinimum
      ? `还缺 ${config.evidenceMinimum - input.evidence.length} 条证据`
      : null,
    missingTypes.length
      ? `尚未覆盖：${missingTypes
          .map(
            (type) =>
              config.evidenceTypes.find((item) => item.value === type)?.label ??
              type,
          )
          .join("、")}`
      : null,
    artifactText.length < config.artifactMinimum
      ? `${config.artifactTitle}尚未形成可复核的完整判断`
      : null,
  ].filter(Boolean) as string[];
  return {
    scores,
    total,
    requiredRevision,
    strengths:
      total >= 18
        ? `已经能用可追溯证据形成${config.capabilityLabel}的判断。`
        : "已经开始把主观判断转化为可被现实检验的材料。",
    weaknesses:
      gaps.join("；") || "目前没有阻断性缺口，但仍应保留结论边界。",
  };
}

export function scoreFalseDemandArtifact(input: {
  baseline: BaselineDiagnosisRecord;
  evidence: EvidenceSubmissionRecord[];
  artifact: AnswerPathArtifactRecord;
}) {
  return scoreAnswerPathArtifact(formalAnswerPathConfigs[0], input);
}

export function completionProgress(input: {
  hasBaseline: boolean;
  evidenceCount: number;
  evidenceMinimum?: number;
  artifactCount: number;
  reviewCount: number;
  latestReviewRequiresRevision: boolean | null;
  hasOutcome: boolean;
}) {
  if (input.hasOutcome) return 100;
  if (input.reviewCount > 0 && input.latestReviewRequiresRevision === false)
    return 86;
  if (input.reviewCount > 0) return 72;
  if (input.artifactCount > 0) return 58;
  if (input.evidenceCount >= (input.evidenceMinimum ?? 5)) return 44;
  if (input.evidenceCount > 0)
    return 24 + Math.min(16, input.evidenceCount * 3);
  if (input.hasBaseline) return 18;
  return 0;
}

export function recommendNextAnswerPath(
  enrollments: AnswerPathEnrollmentRecord[],
) {
  const active = enrollments
    .filter((item) => item.status !== "completed")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  if (active) return getFormalAnswerPath(active.pathSlug);
  const completed = new Set(
    enrollments
      .filter((item) => item.status === "completed")
      .map((item) => item.pathSlug),
  );
  return formalAnswerPathConfigs.find((path) => !completed.has(path.slug)) ?? null;
}

export const capabilityLevelLabels = [
  "尚未接触",
  "能够解释",
  "能够在引导下应用",
  "能够独立应用",
  "能够迁移到新情境",
  "能够指导他人",
] as const;

export function answerPathNextStep(
  enrollment: AnswerPathEnrollmentRecord | null,
  config: FormalAnswerPathConfig,
) {
  if (!enrollment) {
    return {
      label: "开始诊断",
      title: config.entryTitle,
      description: "先留下现在的判断，再进入现实行动。",
    };
  }
  const steps: Record<
    string,
    { label: string; title: string; description: string }
  > = {
    baseline: {
      label: "完成基线",
      title: "写下当前判断与最大不确定性",
      description: "这份基线会在路径结束时帮助你看见判断如何变化。",
    },
    evidence: {
      label: "继续行动",
      title: `继续收集${config.evidenceTypes
        .slice(0, 2)
        .map((item) => item.label)
        .join("与")}`,
      description: `至少保留 ${config.evidenceMinimum} 条可追溯证据。`,
    },
    artifact: {
      label: "形成作品",
      title: `完成第一版${config.artifactTitle}`,
      description: "把事实、反证、判断和边界放进同一份可复核作品。",
    },
    review: {
      label: "接受审阅",
      title: `提交${config.artifactTitle}的反方审阅`,
      description: "Agent 会依据公开量规指出阻断性缺口。",
    },
    revision: {
      label: "完成修订",
      title: "依据证据重新行动并修订",
      description: "补足关键缺口，而不是只改写措辞。",
    },
    outcome: {
      label: "回到现实",
      title: "记录真实结果并完成路径",
      description: "用现实中发生的变化证明能力，而不是以阅读结束。",
    },
    completed: {
      label: "查看能力",
      title: `${config.capabilityLabel}已写入能力档案`,
      description: "查看证据来源，并迁移到下一条路径。",
    },
  };
  return steps[enrollment.currentStep] ?? steps.baseline;
}

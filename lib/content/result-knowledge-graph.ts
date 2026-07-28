export const KNOWLEDGE_GRAPH_VERSION = "2026.07-v1.3";

export type KnowledgeNodeDefinition = {
  slug: string;
  title: string;
  question: string;
  explanation: string;
  boundary: string;
};

export const resultKnowledgeNodes: KnowledgeNodeDefinition[] = [
  {
    slug: "behavior-versus-attitude",
    title: "行为证据与态度表达",
    question: "一个人说喜欢，和真正采取行动有什么区别？",
    explanation:
      "态度表达容易受到礼貌、想象和提问方式影响；已经发生的行为会暴露替代方案、约束与真实优先级。",
    boundary:
      "行为也受机会、权限和伦理约束；没有付款不必然等于没有价值。",
  },
  {
    slug: "sample-situation-fit",
    title: "样本与情境匹配",
    question: "你问到的人，真的处在问题发生的情境里吗？",
    explanation:
      "有效样本不仅共享人口标签，还应共享问题发生的情境、约束、频率和可选择的替代方案。",
    boundary:
      "少量样本适合发现机制与反例，不适合未经说明地外推总体比例。",
  },
  {
    slug: "counterevidence",
    title: "反例与推翻条件",
    question: "什么事实出现时，你会承认当前判断不成立？",
    explanation:
      "预先寻找反例和推翻条件，可以防止只收集支持自己的材料，并让结论保留清晰边界。",
    boundary:
      "一个反例不一定推翻全部结论，但必须解释它限定了哪些人群或情境。",
  },
  {
    slug: "provenance",
    title: "证据来源与可追溯性",
    question: "他人能否回到原始材料复核你的判断？",
    explanation:
      "来源记录应说明对象、时间、版本、原话或保存位置，使事实与后来解释能够被重新核对。",
    boundary:
      "可追溯不代表来源一定可靠；仍需判断采集方式、利益关系和语境。",
  },
  {
    slug: "non-leading-questions",
    title: "非诱导提问",
    question: "如何提问，才不会把期待塞进受访者的答案？",
    explanation:
      "优先追问最近一次具体行为、发生顺序与真实约束，避免推销方案、预测未来和暗示正确回答。",
    boundary:
      "完全中性的提问很难实现，因此应保留提纲并持续检查诱导风险。",
  },
  {
    slug: "interview-raw-record",
    title: "访谈原始记录",
    question: "为什么不能只留下访谈者自己的总结？",
    explanation:
      "原始问题、原话与上下文能帮助审阅者区分事实、解释和访谈者的选择性记忆。",
    boundary:
      "保存记录必须取得合适授权，并避免公开敏感身份与私人信息。",
  },
  {
    slug: "artifact-as-evidence",
    title: "作品作为能力证据",
    question: "一件作品怎样证明你会使用知识，而不只是接触过知识？",
    explanation:
      "可信作品应展示真实问题、方法选择、来源、关键取舍、外部反馈和修订前后的变化。",
    boundary:
      "一件作品只证明特定情境中的能力，不能自动代表所有相邻能力。",
  },
  {
    slug: "contribution-boundary",
    title: "用户与 Agent 的贡献边界",
    question: "作品中的判断究竟由谁完成？",
    explanation:
      "关键认知、现实行动和最终取舍应由用户承担；Agent 可以整理、检索、计算和提出反方问题。",
    boundary:
      "使用 Agent 不会让作品失效，但隐藏 Agent 贡献会破坏证明的可信度。",
  },
  {
    slug: "revision-evidence",
    title: "修订证据",
    question: "修改如何证明学习真的发生了？",
    explanation:
      "把初稿、反馈、采取或拒绝的建议与新版本并列，可以看见判断怎样因证据而改变。",
    boundary:
      "措辞变化不等于能力提升；修订必须回应明确缺口或现实结果。",
  },
  {
    slug: "largest-uncertainty",
    title: "最大不确定性",
    question: "当前最值得用原型换取答案的未知是什么？",
    explanation:
      "先识别最可能改变决定的未知，再选择原型范围，可以减少无助于学习的功能投入。",
    boundary:
      "最大不确定性会随证据变化，需要在每轮测试后重新判断。",
  },
  {
    slug: "prototype-fidelity",
    title: "原型保真度与验证边界",
    question: "原型应该做到多像最终产品？",
    explanation:
      "保真度应服务于当前假设：纸面流程可检验理解，高保真交互可检验使用，工程样机可检验性能。",
    boundary:
      "低保真原型不能证明安全、性能、长期留存或规模化能力。",
  },
  {
    slug: "task-based-testing",
    title: "任务式原型测试",
    question: "为什么要观察任务，而不是询问用户喜不喜欢？",
    explanation:
      "给出具体任务并观察动作、停顿、失败和替代行为，可以发现界面背后的理解与约束。",
    boundary:
      "测试情境本身会影响行为，结论必须说明任务、环境与样本条件。",
  },
  {
    slug: "real-commitment",
    title: "真实承诺",
    question: "用户愿意付出什么，才能构成比喜欢更强的证据？",
    explanation:
      "金钱、时间、数据、风险、引荐或改变习惯都可能构成真实承诺，关键是它确实存在机会成本。",
    boundary:
      "承诺实验必须合乎伦理，不得用误导、强迫或不对称风险换取转化。",
  },
  {
    slug: "purchase-authority",
    title: "购买权、使用权与受益者",
    question: "喜欢方案的人，是否真的能够决定使用或购买？",
    explanation:
      "使用者、受益者、付款者和批准者可能不是同一个人；价值判断必须放回真实决策链。",
    boundary:
      "决策链会随组织和金额变化，不能用单一职位标签代替调查。",
  },
  {
    slug: "pricing-as-hypothesis",
    title: "价格作为假设",
    question: "价格是在收钱，还是在检验价值与约束？",
    explanation:
      "价格同时影响人群、承诺强度和比较对象，应与价值主张、预算权限和替代成本一起验证。",
    boundary:
      "一次价格失败不能单独区分需求、产品、渠道或信任问题。",
  },
  {
    slug: "decision-threshold",
    title: "决策门槛",
    question: "什么结果会触发继续、调整或停止？",
    explanation:
      "在行动前定义最低证据、时间窗口和停止条件，能减少结果出现后的自我辩护。",
    boundary:
      "门槛不是永远不变；修改时必须记录新信息和修改理由。",
  },
  {
    slug: "opportunity-cost",
    title: "机会成本",
    question: "继续当前项目意味着放弃什么？",
    explanation:
      "除已投入资源外，还应比较剩余现金、时间、团队注意力和其他可行选择的价值。",
    boundary:
      "机会成本通常无法精确计算，但不能因此在决策中把它视为零。",
  },
  {
    slug: "sunk-cost",
    title: "沉没成本",
    question: "已经投入很多，为什么不能成为继续的充分理由？",
    explanation:
      "已经无法收回的投入不改变未来收益与风险；决定应基于新增投入能换来什么。",
    boundary:
      "历史投入仍可提供能力、资产和信息，但应作为可用资源而非道德压力。",
  },
] as const;

export type ResultKnowledgeRelation = {
  pathSlug: string;
  programs: Array<{
    slug: string;
    capability: string;
    resultUse: string;
  }>;
  courses: Array<{
    slug: string;
    role: string;
    practiceCredits: number;
    knowledgeNodeSlugs: string[];
  }>;
};

export const resultKnowledgeRelations: ResultKnowledgeRelation[] = [
  {
    pathSlug: "is-this-a-false-demand",
    programs: [
      { slug: "marketing", capability: "需求与市场判断", resultUse: "需求证据表" },
      { slug: "sociology", capability: "真实情境中的社会研究", resultUse: "行为与反例记录" },
      { slug: "entrepreneurship-innovation", capability: "机会验证", resultUse: "继续／停止判断" },
    ],
    courses: [
      {
        slug: "4p-stp",
        role: "把需求证据转化为市场选择与定位判断",
        practiceCredits: 1,
        knowledgeNodeSlugs: [
          "behavior-versus-attitude",
          "sample-situation-fit",
          "counterevidence",
          "provenance",
        ],
      },
      {
        slug: "marketing-4",
        role: "提供市场研究的采样、证据与解释框架",
        practiceCredits: 0,
        knowledgeNodeSlugs: ["sample-situation-fit", "provenance"],
      },
    ],
  },
  {
    pathSlug: "non-leading-user-interviews",
    programs: [
      { slug: "sociology", capability: "质性研究", resultUse: "五次访谈证据包" },
      { slug: "marketing", capability: "用户与市场研究", resultUse: "非诱导访谈记录" },
      { slug: "industrial-design", capability: "用户研究", resultUse: "问题与行为证据" },
    ],
    courses: [
      {
        slug: "4p-stp",
        role: "为市场细分与目标用户选择提供可复核访谈证据",
        practiceCredits: 1,
        knowledgeNodeSlugs: [
          "non-leading-questions",
          "interview-raw-record",
          "sample-situation-fit",
          "counterevidence",
        ],
      },
      {
        slug: "sociology-foundation-8",
        role: "连接质性研究方法与访谈证据",
        practiceCredits: 0,
        knowledgeNodeSlugs: ["non-leading-questions", "interview-raw-record"],
      },
    ],
  },
  {
    pathSlug: "course-to-portfolio",
    programs: [
      { slug: "journalism-communication", capability: "研究表达", resultUse: "可公开作品案例" },
      { slug: "industrial-design", capability: "作品与设计论证", resultUse: "初稿、反馈与修订" },
      { slug: "learning-science", capability: "知识迁移", resultUse: "课程知识应用记录" },
    ],
    courses: [
      {
        slug: "4p-stp",
        role: "将市场判断转化为可展示的研究或策略作品",
        practiceCredits: 1,
        knowledgeNodeSlugs: ["artifact-as-evidence", "contribution-boundary", "revision-evidence"],
      },
      {
        slug: "porter-five-forces",
        role: "将行业分析转化为可审阅的战略作品",
        practiceCredits: 1,
        knowledgeNodeSlugs: ["artifact-as-evidence", "provenance", "revision-evidence"],
      },
      {
        slug: "disruptive-innovation",
        role: "将创新判断转化为有证据边界的案例作品",
        practiceCredits: 1,
        knowledgeNodeSlugs: ["artifact-as-evidence", "counterevidence", "contribution-boundary"],
      },
    ],
  },
  {
    pathSlug: "first-prototype-scope",
    programs: [
      { slug: "industrial-design", capability: "原型与测试", resultUse: "原型测试报告" },
      { slug: "design-technology", capability: "技术原型判断", resultUse: "范围与失败记录" },
      { slug: "entrepreneurship-innovation", capability: "最小实验", resultUse: "下一版决策" },
    ],
    courses: [
      {
        slug: "disruptive-innovation",
        role: "把创新假设转化为足以进入真实测试的原型",
        practiceCredits: 1,
        knowledgeNodeSlugs: ["largest-uncertainty", "prototype-fidelity", "task-based-testing"],
      },
      {
        slug: "industrial-design-5",
        role: "连接产品设计、保真度与任务测试",
        practiceCredits: 0,
        knowledgeNodeSlugs: ["prototype-fidelity", "task-based-testing"],
      },
    ],
  },
  {
    pathSlug: "liking-without-paying",
    programs: [
      { slug: "marketing", capability: "价值与承诺验证", resultUse: "真实成本实验" },
      { slug: "entrepreneurship-innovation", capability: "商业实验", resultUse: "承诺与拒绝记录" },
      { slug: "business-administration", capability: "商业判断", resultUse: "人群、方案与价格决策" },
    ],
    courses: [
      {
        slug: "4p-stp",
        role: "检验价值主张、价格、人群与渠道是否形成真实交换",
        practiceCredits: 2,
        knowledgeNodeSlugs: [
          "real-commitment",
          "purchase-authority",
          "pricing-as-hypothesis",
          "behavior-versus-attitude",
        ],
      },
    ],
  },
  {
    pathSlug: "continue-pivot-or-stop",
    programs: [
      { slug: "business-administration", capability: "战略取舍", resultUse: "项目取舍备忘录" },
      { slug: "entrepreneurship-innovation", capability: "项目决策", resultUse: "继续／调整／停止结果" },
      { slug: "marketing", capability: "市场与资源判断", resultUse: "机会成本与里程碑证据" },
    ],
    courses: [
      {
        slug: "porter-five-forces",
        role: "把外部结构、资源约束与下一步选择放进同一判断",
        practiceCredits: 2,
        knowledgeNodeSlugs: ["decision-threshold", "opportunity-cost", "sunk-cost", "counterevidence"],
      },
      {
        slug: "business-administration-6",
        role: "连接公司战略、资源配置和退出条件",
        practiceCredits: 0,
        knowledgeNodeSlugs: ["decision-threshold", "opportunity-cost", "sunk-cost"],
      },
    ],
  },
];

export function resultRelationForPath(pathSlug: string) {
  return (
    resultKnowledgeRelations.find((relation) => relation.pathSlug === pathSlug) ??
    null
  );
}

export function resultRelationsForCourse(courseSlug: string) {
  return resultKnowledgeRelations
    .map((relation) => ({
      ...relation,
      course: relation.courses.find((course) => course.slug === courseSlug),
    }))
    .filter(
      (
        relation,
      ): relation is ResultKnowledgeRelation & {
        course: ResultKnowledgeRelation["courses"][number];
      } => Boolean(relation.course),
    );
}

export function resultRelationsForProgram(programSlug: string) {
  return resultKnowledgeRelations
    .map((relation) => ({
      ...relation,
      program: relation.programs.find((program) => program.slug === programSlug),
    }))
    .filter(
      (
        relation,
      ): relation is ResultKnowledgeRelation & {
        program: ResultKnowledgeRelation["programs"][number];
      } => Boolean(relation.program),
    );
}

export function getResultKnowledgeNode(slug: string) {
  return resultKnowledgeNodes.find((node) => node.slug === slug) ?? null;
}

export function resultRelationsForKnowledgeNode(nodeSlug: string) {
  return resultKnowledgeRelations.flatMap((relation) =>
    relation.courses
      .filter((course) => course.knowledgeNodeSlugs.includes(nodeSlug))
      .map((course) => ({ pathSlug: relation.pathSlug, course })),
  );
}

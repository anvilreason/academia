export const ANSWER_CONTENT_VERSION = "2026.07-v1";
export const ANSWER_EVALUATION_VERSION = "rubric-v1";

export const creationStages = [
  {
    slug: "discover",
    name: "发现问题",
    index: "01",
    description: "先确认什么值得解决，而不是急着寻找方法。",
  },
  {
    slug: "judge",
    name: "建立判断",
    index: "02",
    description: "把模糊直觉变成可以被证据推翻的判断。",
  },
  {
    slug: "make",
    name: "做出作品",
    index: "03",
    description: "用足够小、足够真实的作品进入现实。",
  },
  {
    slug: "validate",
    name: "验证现实",
    index: "04",
    description: "让行为、成本和结果检验自己的假设。",
  },
  {
    slug: "grow",
    name: "获得增长",
    index: "05",
    description: "找到可以重复的价值，而不是追逐一次流量。",
  },
  {
    slug: "organize",
    name: "建立组织",
    index: "06",
    description: "把个人判断变成能与他人协作的方法。",
  },
] as const;

export const capabilityDomains = [
  "用户与社会",
  "产品与设计",
  "商业与财务",
  "数据与证据",
  "技术与 AI",
  "表达、协作与组织",
] as const;

export type CreationStageSlug = (typeof creationStages)[number]["slug"];
export type CapabilityDomain = (typeof capabilityDomains)[number];
export type AnswerPathStatus = "flagship-building" | "question-index";

export type KnowledgeLink = {
  label: string;
  schoolSlug: string;
  programSlug?: string;
  courseSlug?: string;
  reason: string;
};

export type AnswerPathPreview = {
  whyMisjudged: string;
  misconceptions: string[];
  requiredAction: string;
  evidence: string;
  decision: string;
  boundary: string;
};

export type AnswerTopic = {
  slug: string;
  title: string;
  initialConclusion: string;
  stage: CreationStageSlug;
  capabilityDomain: CapabilityDomain;
  duration: string;
  artifact: string;
  disciplines: string[];
  status: AnswerPathStatus;
  flagship: boolean;
  version: string;
  knowledgeLinks: KnowledgeLink[];
  preview?: AnswerPathPreview;
};

const schoolLinks = {
  business: {
    label: "商学院",
    schoolSlug: "business",
    programSlug: "marketing",
    reason: "理解需求、交换、定价与市场选择。",
  },
  social: {
    label: "社会科学学院",
    schoolSlug: "social-sciences",
    reason: "理解人、群体、制度与研究方法。",
  },
  design: {
    label: "建筑与设计学院",
    schoolSlug: "architecture-design",
    programSlug: "industrial-design",
    reason: "把判断转化为可以使用和检验的作品。",
  },
  computing: {
    label: "计算与智能学院",
    schoolSlug: "computing",
    reason: "理解技术可行性、原型边界与 AI 协作。",
  },
  journalism: {
    label: "传媒与艺术学院",
    schoolSlug: "media-arts",
    programSlug: "journalism-communication",
    reason: "形成可信表达、研究写作与传播判断。",
  },
  law: {
    label: "法学院",
    schoolSlug: "law",
    reason: "识别规则、责任、权利和事实边界。",
  },
} satisfies Record<string, KnowledgeLink>;

function topic(
  input: Omit<AnswerTopic, "version" | "knowledgeLinks"> & {
    links: KnowledgeLink[];
  },
): AnswerTopic {
  const { links, ...rest } = input;
  return {
    ...rest,
    version: ANSWER_CONTENT_VERSION,
    knowledgeLinks: links,
  };
}

export const answerTopics: AnswerTopic[] = [
  topic({
    slug: "is-this-a-false-demand",
    title: "如何判断一个想法是不是伪需求？",
    initialConclusion: "先找正在发生的行为与代价，再讨论用户是否喜欢这个想法。",
    stage: "discover",
    capabilityDomain: "用户与社会",
    duration: "7—10 天",
    artifact: "需求证据表与继续／停止判断",
    disciplines: ["用户研究", "行为经济学", "市场营销"],
    status: "flagship-building",
    flagship: true,
    links: [
      schoolLinks.social,
      {
        ...schoolLinks.business,
        courseSlug: "4p-stp",
        reason: "用市场选择和需求证据检验想法。",
      },
    ],
    preview: {
      whyMisjudged: "我们很容易把自己的兴奋、朋友的鼓励和礼貌性反馈当成需求证据。",
      misconceptions: [
        "很多人说喜欢，就等于需求成立",
        "没有同类产品，就说明机会足够大",
        "功能越完整，越容易验证需求",
      ],
      requiredAction: "找到 5 位符合条件的人，记录他们最近一次真实行为、替代方案与已经付出的成本。",
      evidence: "访谈原始记录、现有替代行为、至少一次带真实成本的验证。",
      decision: "继续验证、缩小问题、改变人群，或停止投入。",
      boundary: "这条路径只能降低需求判断的不确定性，不能保证项目一定成功。",
    },
  }),
  topic({
    slug: "find-a-problem-worth-years",
    title: "如何发现值得长期投入的问题？",
    initialConclusion: "长期问题同时需要持续张力、个人接近度和可积累的行动空间。",
    stage: "discover",
    capabilityDomain: "用户与社会",
    duration: "5—7 天",
    artifact: "问题机会清单",
    disciplines: ["社会研究", "职业发展", "创新管理"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.social, schoolLinks.business],
  }),
  topic({
    slug: "stated-vs-real-needs",
    title: "用户说的需求为什么经常不是真需求？",
    initialConclusion: "语言表达的是解释，真实约束通常藏在行为、环境和利益关系里。",
    stage: "discover",
    capabilityDomain: "用户与社会",
    duration: "3—5 天",
    artifact: "需求分层图",
    disciplines: ["社会学", "心理学", "用户研究"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.social, schoolLinks.design],
  }),
  topic({
    slug: "interest-ability-opportunity",
    title: "如何区分自己的兴趣、能力和市场机会？",
    initialConclusion: "把喜欢、做得好和有人需要分别举证，再寻找三者可以共同积累的交集。",
    stage: "discover",
    capabilityDomain: "商业与财务",
    duration: "5—7 天",
    artifact: "个人机会假设图",
    disciplines: ["心理学", "战略", "劳动经济学"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.social, schoolLinks.business],
  }),
  topic({
    slug: "learning-as-avoidance",
    title: "如何避免用学习和准备逃避行动？",
    initialConclusion: "每次学习都应绑定一个近期决策或产物，否则准备会无限延长。",
    stage: "discover",
    capabilityDomain: "产品与设计",
    duration: "2—3 天",
    artifact: "最小行动契约",
    disciplines: ["学习科学", "行为科学", "项目管理"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.social, schoolLinks.design],
  }),
  topic({
    slug: "data-or-interviews",
    title: "什么时候应该相信数据，什么时候应该相信访谈？",
    initialConclusion: "数据说明发生了什么，访谈帮助解释为什么；两者都要接受采样与因果边界。",
    stage: "judge",
    capabilityDomain: "数据与证据",
    duration: "4—6 天",
    artifact: "证据选择说明",
    disciplines: ["统计学", "质性研究", "因果推断"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.social, schoolLinks.business],
  }),
  topic({
    slug: "judge-source-credibility",
    title: "如何判断一条信息或观点是否可信？",
    initialConclusion: "先检查来源、方法、利益关系与可复核性，再判断结论能走多远。",
    stage: "judge",
    capabilityDomain: "数据与证据",
    duration: "2—4 天",
    artifact: "来源审查卡",
    disciplines: ["认识论", "新闻核查", "研究方法"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.journalism, schoolLinks.social],
  }),
  topic({
    slug: "find-real-target-users",
    title: "如何找到真正的目标用户？",
    initialConclusion: "目标用户不是人口标签，而是共享同一情境、约束与替代行为的人。",
    stage: "judge",
    capabilityDomain: "用户与社会",
    duration: "5—7 天",
    artifact: "目标用户判定标准",
    disciplines: ["STP", "用户研究", "社会网络"],
    status: "question-index",
    flagship: false,
    links: [
      {
        ...schoolLinks.business,
        courseSlug: "4p-stp",
      },
      schoolLinks.social,
    ],
  }),
  topic({
    slug: "non-leading-user-interviews",
    title: "如何进行不诱导答案的用户访谈？",
    initialConclusion: "询问过去发生的具体行为，不推销方案，也不让受访者预测未来。",
    stage: "judge",
    capabilityDomain: "用户与社会",
    duration: "5—7 天",
    artifact: "访谈提纲、原始记录与证据摘要",
    disciplines: ["质性研究", "用户研究", "认知偏差"],
    status: "flagship-building",
    flagship: true,
    links: [schoolLinks.social, schoolLinks.design],
    preview: {
      whyMisjudged: "提问者常在无意中透露期待，受访者也倾向于礼貌地配合。",
      misconceptions: [
        "询问你会不会买就能预测购买",
        "完整介绍方案有助于获得真实反馈",
        "访谈结束后只保留自己的总结",
      ],
      requiredAction: "完成至少 5 次符合招募标准的访谈，并保留原始问题与逐字证据。",
      evidence: "招募标准、访谈提纲、原始记录、反例与未解决问题。",
      decision: "保留、修改或推翻最初的用户与问题假设。",
      boundary: "访谈不能替代真实行为实验，也不能代表未被覆盖的人群。",
    },
  }),
  topic({
    slug: "from-ambiguity-to-hypothesis",
    title: "如何把模糊问题变成可以验证的假设？",
    initialConclusion: "明确对象、情境、可观察变化和推翻条件，假设才开始有用。",
    stage: "judge",
    capabilityDomain: "数据与证据",
    duration: "2—4 天",
    artifact: "可证伪假设表",
    disciplines: ["科学方法", "逻辑学", "实验设计"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.social, schoolLinks.design],
  }),
  topic({
    slug: "course-to-portfolio",
    title: "如何把一门课程变成可展示的作品？",
    initialConclusion: "从课程知识中选择一个真实问题，用作品展示判断、过程、证据与修订。",
    stage: "make",
    capabilityDomain: "表达、协作与组织",
    duration: "7—14 天",
    artifact: "一件可公开讲述的课程作品",
    disciplines: ["项目制学习", "研究写作", "作品集设计"],
    status: "flagship-building",
    flagship: true,
    links: [schoolLinks.design, schoolLinks.journalism],
    preview: {
      whyMisjudged: "笔记和结课证明只能说明接触过知识，不能说明能否独立应用。",
      misconceptions: [
        "把课堂作业排版精美就成了作品",
        "只展示最终答案，不展示证据与取舍",
        "让 Agent 生成全部内容再署自己的名字",
      ],
      requiredAction: "选择一个真实对象，完成问题定义、方法选择、初稿、外部反馈和一次修订。",
      evidence: "过程记录、来源、用户贡献说明、初稿与修订稿对比。",
      decision: "公开、继续修订，或补足尚未被作品证明的能力。",
      boundary: "作品能证明特定情境中的能力，不能自动代表所有相邻能力。",
    },
  }),
  topic({
    slug: "first-prototype-scope",
    title: "第一个原型应该做到什么程度？",
    initialConclusion: "只做到足以检验当前最大不确定性，不把完整度误当成学习速度。",
    stage: "make",
    capabilityDomain: "产品与设计",
    duration: "5—10 天",
    artifact: "可测试原型与测试脚本",
    disciplines: ["产品设计", "交互设计", "精益实验"],
    status: "flagship-building",
    flagship: true,
    links: [schoolLinks.design, schoolLinks.computing],
    preview: {
      whyMisjudged: "做得更完整让人感到安全，却可能让团队更晚发现核心假设是错的。",
      misconceptions: [
        "原型必须看起来像最终产品",
        "功能越多，收集到的反馈越全面",
        "技术实现完成才算能测试",
      ],
      requiredAction: "写下当前最大不确定性，删去不能帮助检验它的部分，并让真实对象完成一次任务。",
      evidence: "原型、测试脚本、观察记录、失败点与下一版改动。",
      decision: "继续构建、缩小范围、换验证方式，或回到问题定义。",
      boundary: "低保真原型适合检验理解与交互，不足以验证性能、安全或规模化能力。",
    },
  }),
  topic({
    slug: "no-code-testable-product",
    title: "没有技术背景，应该如何做出可测试产品？",
    initialConclusion: "先用人工服务、现成工具和可替换组件验证价值，再决定哪些能力必须自建。",
    stage: "make",
    capabilityDomain: "技术与 AI",
    duration: "7—14 天",
    artifact: "可运行的手工或无代码服务",
    disciplines: ["无代码开发", "服务设计", "技术判断"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.computing, schoolLinks.design],
  }),
  topic({
    slug: "credible-research-report",
    title: "如何把研究、分析和判断写成一份可信报告？",
    initialConclusion: "把事实、推断和建议分开，让读者能追溯来源并看到不确定性。",
    stage: "make",
    capabilityDomain: "表达、协作与组织",
    duration: "5—10 天",
    artifact: "可审阅研究报告",
    disciplines: ["研究方法", "论证写作", "信息设计"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.journalism, schoolLinks.social],
  }),
  topic({
    slug: "first-version-with-uncertainty",
    title: "如何在信息不完整时做出第一个版本？",
    initialConclusion: "记录关键假设与可逆决策，用最小版本换取下一轮更好的信息。",
    stage: "make",
    capabilityDomain: "产品与设计",
    duration: "3—7 天",
    artifact: "假设清单与第一版",
    disciplines: ["决策科学", "产品管理", "风险管理"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.design, schoolLinks.business],
  }),
  topic({
    slug: "liking-without-paying",
    title: "为什么用户说喜欢，却不愿意付出成本？",
    initialConclusion: "喜欢是态度，付出金钱、时间、数据或改变习惯才是行为证据。",
    stage: "validate",
    capabilityDomain: "商业与财务",
    duration: "7—10 天",
    artifact: "需求证据表与真实成本实验",
    disciplines: ["用户研究", "行为经济学", "定价", "实验设计"],
    status: "flagship-building",
    flagship: true,
    links: [
      {
        ...schoolLinks.business,
        courseSlug: "4p-stp",
        reason: "连接市场选择、价值交换与真实购买行为。",
      },
      schoolLinks.social,
    ],
    preview: {
      whyMisjudged: "礼貌性反馈、错误样本和诱导问题会放大口头喜欢，掩盖真实约束。",
      misconceptions: [
        "没有付款只是因为价格还不够低",
        "受访者说以后会用，就代表需求真实",
        "一次失败足以证明整个需求不存在",
      ],
      requiredAction: "完成至少 5 次非诱导访谈，并设计一次需要对方付出真实成本的验证。",
      evidence: "痛点强度、使用频率、替代成本、购买权限、预算和实验行为记录。",
      decision: "继续、调整人群／方案／价格／渠道，或停止。",
      boundary: "付费不是唯一成本；公共服务和高风险场景需要采用其他合乎伦理的行为证据。",
    },
  }),
  topic({
    slug: "falsifiable-experiment",
    title: "如何设计一次真正能推翻假设的实验？",
    initialConclusion: "预先写下成功、失败和停止标准，实验才不会只为自己寻找支持。",
    stage: "validate",
    capabilityDomain: "数据与证据",
    duration: "4—7 天",
    artifact: "预注册实验方案",
    disciplines: ["实验设计", "统计学", "科学哲学"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.social, schoolLinks.business],
  }),
  topic({
    slug: "diagnose-demand-product-price-channel",
    title: "如何判断失败来自需求、产品、价格还是渠道？",
    initialConclusion: "建立可分离的证据链，避免用一个总转化率解释四种不同问题。",
    stage: "validate",
    capabilityDomain: "商业与财务",
    duration: "5—8 天",
    artifact: "失败原因诊断树",
    disciplines: ["市场营销", "定价", "产品分析"],
    status: "question-index",
    flagship: false,
    links: [
      {
        ...schoolLinks.business,
        courseSlug: "4p-stp",
      },
      schoolLinks.design,
    ],
  }),
  topic({
    slug: "enough-evidence",
    title: "多少访谈、样本和数据才足以支持决策？",
    initialConclusion: "样本量取决于决策风险、信号强度和人群差异，而不是一个万能数字。",
    stage: "validate",
    capabilityDomain: "数据与证据",
    duration: "3—5 天",
    artifact: "证据充分性说明",
    disciplines: ["统计学", "质性研究", "决策理论"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.social],
  }),
  topic({
    slug: "continue-pivot-or-stop",
    title: "应该继续、调整还是停止一个项目？",
    initialConclusion: "用预先定义的证据门槛、机会成本和新增信息价值做决定，不让沉没成本替你选择。",
    stage: "validate",
    capabilityDomain: "商业与财务",
    duration: "4—7 天",
    artifact: "继续／调整／停止决策备忘录",
    disciplines: ["战略", "决策科学", "创业财务"],
    status: "flagship-building",
    flagship: true,
    links: [
      {
        ...schoolLinks.business,
        courseSlug: "porter-five-forces",
        reason: "把外部结构、资源约束和下一步选择放在同一张判断图上。",
      },
      schoolLinks.social,
    ],
    preview: {
      whyMisjudged: "投入越多越难停止，而一次好消息又可能让团队忽略长期反证。",
      misconceptions: [
        "坚持本身就是正确",
        "没有增长就必须立刻停止",
        "调整意味着否定之前所有工作",
      ],
      requiredAction: "整理关键假设、已有证据、现金与时间约束，并邀请一位不负责该项目的人做反方审查。",
      evidence: "里程碑记录、正反证据、机会成本、资源余量和停止标准。",
      decision: "继续原方向、缩小或改变关键假设、有条件暂停，或结束项目。",
      boundary: "框架不能替代对法律、健康和重大财务风险的专业判断。",
    },
  }),
  topic({
    slug: "first-twenty-users",
    title: "如何找到前 20 位真正用户？",
    initialConclusion: "从问题发生的具体场域和信任关系出发，而不是先追求大规模曝光。",
    stage: "grow",
    capabilityDomain: "用户与社会",
    duration: "7—14 天",
    artifact: "首批用户招募记录",
    disciplines: ["社群研究", "销售", "渠道策略"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.business, schoolLinks.social],
  }),
  topic({
    slug: "why-users-do-not-return",
    title: "用户为什么第一次使用后不再回来？",
    initialConclusion: "区分价值不足、触发缺失、使用成本和错误人群，再决定是否优化留存。",
    stage: "grow",
    capabilityDomain: "产品与设计",
    duration: "5—8 天",
    artifact: "流失诊断与回访证据",
    disciplines: ["产品分析", "行为科学", "服务设计"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.design, schoolLinks.business],
  }),
  topic({
    slug: "traffic-vs-real-growth",
    title: "如何区分短期流量和真实增长？",
    initialConclusion: "增长必须带来可持续的价值行为，而不只是新增访问或注册。",
    stage: "grow",
    capabilityDomain: "数据与证据",
    duration: "3—5 天",
    artifact: "增长质量仪表板定义",
    disciplines: ["增长分析", "单位经济模型", "行为指标"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.business],
  }),
  topic({
    slug: "choose-current-channel",
    title: "如何选择适合当前阶段的渠道？",
    initialConclusion: "先匹配用户密度、信任门槛和学习速度，再比较渠道规模。",
    stage: "grow",
    capabilityDomain: "商业与财务",
    duration: "4—7 天",
    artifact: "渠道优先级实验表",
    disciplines: ["渠道管理", "传播学", "销售"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.business, schoolLinks.journalism],
  }),
  topic({
    slug: "honest-growth-metrics",
    title: "如何建立不会欺骗自己的增长指标？",
    initialConclusion: "指标必须连接用户价值、排除虚荣行为，并同时展示代价与反指标。",
    stage: "grow",
    capabilityDomain: "数据与证据",
    duration: "3—5 天",
    artifact: "核心指标与反指标说明",
    disciplines: ["数据分析", "管理会计", "产品管理"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.business],
  }),
  topic({
    slug: "when-to-find-cofounder",
    title: "什么时候应该寻找合伙人？",
    initialConclusion: "只有长期互补、共同承担风险和可验证协作成立时，合伙才优于雇佣或合作。",
    stage: "organize",
    capabilityDomain: "表达、协作与组织",
    duration: "7—14 天",
    artifact: "共同工作测试与合伙备忘录",
    disciplines: ["组织行为", "公司治理", "创业管理"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.business, schoolLinks.law],
  }),
  topic({
    slug: "self-hire-or-agent",
    title: "如何判断应该自己做、招人还是交给 Agent？",
    initialConclusion: "关键判断与能力形成应由人承担，标准化且可验证的执行再考虑委托。",
    stage: "organize",
    capabilityDomain: "技术与 AI",
    duration: "3—5 天",
    artifact: "任务责任矩阵",
    disciplines: ["组织设计", "人工智能", "运营管理"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.computing, schoolLinks.business],
  }),
  topic({
    slug: "first-effective-division",
    title: "如何进行第一次有效分工？",
    initialConclusion: "按结果、决策权和交付接口分工，不按含糊职位分配责任。",
    stage: "organize",
    capabilityDomain: "表达、协作与组织",
    duration: "3—5 天",
    artifact: "结果责任与协作接口表",
    disciplines: ["组织设计", "项目管理", "协作沟通"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.business],
  }),
  topic({
    slug: "early-cashflow-awareness",
    title: "如何建立早期项目的现金流意识？",
    initialConclusion: "先看还能活多久、每项承诺何时收付，再谈账面利润和估值。",
    stage: "organize",
    capabilityDomain: "商业与财务",
    duration: "3—5 天",
    artifact: "13 周现金流表",
    disciplines: ["创业财务", "管理会计", "风险管理"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.business],
  }),
  topic({
    slug: "experience-to-team-method",
    title: "如何把个人经验变成团队可复用的方法？",
    initialConclusion: "记录触发条件、判断依据、例外与结果，让方法可以被复现和修正。",
    stage: "organize",
    capabilityDomain: "表达、协作与组织",
    duration: "5—8 天",
    artifact: "可复用方法手册",
    disciplines: ["知识管理", "组织学习", "流程设计"],
    status: "question-index",
    flagship: false,
    links: [schoolLinks.business, schoolLinks.journalism],
  }),
];

export const flagshipAnswerTopics = answerTopics.filter(
  (item) => item.flagship,
);

export function getAnswerTopic(slug: string) {
  return answerTopics.find((item) => item.slug === slug);
}

export function answerTopicsForStage(stage: CreationStageSlug) {
  return answerTopics.filter((item) => item.stage === stage);
}

export function answerTopicsForCourse(courseSlug: string) {
  return answerTopics.filter((item) =>
    item.knowledgeLinks.some((link) => link.courseSlug === courseSlug),
  );
}

export function answerTopicsForSchool(schoolSlug: string) {
  return answerTopics.filter((item) =>
    item.knowledgeLinks.some((link) => link.schoolSlug === schoolSlug),
  );
}

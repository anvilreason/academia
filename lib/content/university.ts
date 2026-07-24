export type CreditBand = {
  label: CreditBandLabel;
  credits: number;
  description: string;
};

export type CreditBandLabel =
  | "大学通识"
  | "学院基础"
  | "专业核心"
  | "方向选修"
  | "实践与毕业";

export type UniversityCourse = {
  slug: string;
  code: string;
  title: string;
  credits: number;
  identityKey: string;
  rigorLevel: number;
  curriculumVersion: string;
  category: CreditBandLabel;
  summary: string;
  application: CourseApplication;
  examWeight: number;
  availability: "open" | "planned";
};

export type CourseApplication = {
  questions: [string, string];
  workScenes: [string, string];
  ventureScenes: [string, string];
  deliverable: string;
  boundary: string;
};

export type ProgramApplication = {
  capabilities: [string, string, string, string];
  workFields: [string, string, string, string];
  ventureFields: [string, string, string];
  portfolio: [string, string, string];
  boundary: string;
};

export type UniversityProgram = {
  slug: string;
  schoolSlug: string;
  name: string;
  degree: string;
  duration: string;
  requiredCredits: number;
  description: string;
  application: ProgramApplication;
  creditPlan: CreditBand[];
  courses: UniversityCourse[];
};

export type UniversitySchool = {
  slug: string;
  name: string;
  englishName: string;
  discipline: string;
  description: string;
  accent: string;
  programs: UniversityProgram[];
};

type ProgramSeed = {
  slug: string;
  name: string;
  degree: string;
  description: string;
  credits: number;
  duration?: string;
  topics: [string, string, string, string];
};

type SchoolSeed = Omit<UniversitySchool, "programs"> & {
  programs: ProgramSeed[];
};

export function courseIdentityKey(title: string) {
  return title
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[：:（）()·、，,\s]/g, "");
}

function courseRigorLevel(
  category: CreditBandLabel,
  discipline: string,
) {
  if (category === "大学通识") return 100;
  if (category === "学院基础") {
    return ["工学", "理学", "医学"].includes(discipline) ? 240 : 220;
  }
  if (category === "专业核心") return 320;
  if (category === "方向选修") return 360;
  return 400;
}

const generalEducationCourses = [
  { title: "学术写作与论证", credits: 3 },
  { title: "中国文明与经典", credits: 3 },
  { title: "世界文明与全球史", credits: 3 },
  { title: "哲学、伦理与人生", credits: 3 },
  { title: "定量推理与数学基础", credits: 4 },
  { title: "科学探究与实验方法", credits: 3 },
  { title: "数据、计算与编程基础", credits: 3 },
  { title: "人工智能素养", credits: 2 },
  { title: "经济、组织与社会", credits: 3 },
  { title: "法律、公民与公共责任", credits: 2 },
  { title: "艺术与审美实践", credits: 2 },
  { title: "外语与跨文化沟通", credits: 4 },
  { title: "体育与身心健康", credits: 3 },
  { title: "气候变化与可持续发展", credits: 2 },
  { title: "创新、设计与创业", credits: 2 },
] as const;

const foundationTitlesByDiscipline: Record<string, string[]> = {
  文学: [
    "人文学研究导论",
    "文献阅读与考证",
    "语言与文本分析",
    "中国思想文化基础",
    "世界文学与文化",
    "历史研究方法",
    "逻辑与批判性思维",
    "古典语言基础",
    "数字人文方法",
    "田野调查与口述史",
    "比较文明研究",
  ],
  法学: [
    "社会科学研究导论",
    "政治与社会理论",
    "法学与制度分析",
    "微观经济学基础",
    "宏观经济学基础",
    "社会统计学",
    "定量社会研究方法",
    "质性社会研究方法",
    "公共伦理",
    "全球化与国际秩序",
    "因果推断基础",
  ],
  管理学: [
    "管理学原理",
    "微观经济学",
    "宏观经济学",
    "会计与财务基础",
    "组织行为学",
    "商业统计",
    "管理信息系统",
    "运营管理基础",
    "商法与商业伦理",
    "市场与顾客分析",
    "管理决策模型",
  ],
  教育学: [
    "教育学原理",
    "教育心理学",
    "学习与认知",
    "课程与教学基础",
    "教育研究方法",
    "教育统计与测量",
    "教育史",
    "教育社会学",
    "儿童与青少年发展",
    "教育技术基础",
    "比较教育",
  ],
  理学: [
    "数学分析",
    "高等代数",
    "概率论",
    "数理统计",
    "普通物理学",
    "基础化学",
    "生命科学导论",
    "计算科学基础",
    "科学计算与建模",
    "实验设计与数据处理",
    "现代科学前沿",
  ],
  医学: [
    "人体解剖学",
    "组织学与胚胎学",
    "生物化学",
    "生理学",
    "医学遗传学",
    "医学微生物学",
    "免疫学",
    "病理学",
    "药理学",
    "流行病学",
    "医学统计学",
  ],
  工学: [
    "工程数学",
    "大学物理",
    "工程化学",
    "工程制图",
    "理论力学",
    "材料力学",
    "电工与电子技术",
    "程序设计基础",
    "工程计算与建模",
    "工程实验方法",
    "工程伦理与安全",
  ],
  艺术学: [
    "艺术史基础",
    "造型与构成",
    "色彩与视觉语言",
    "设计史",
    "创作方法",
    "数字媒介基础",
    "材料与工艺",
    "叙事与传播",
    "艺术批评",
    "田野与用户研究",
    "公共艺术与社会",
  ],
  交叉学科: [
    "复杂系统导论",
    "跨学科研究方法",
    "数学与统计基础",
    "计算与数据基础",
    "生命科学基础",
    "物质科学基础",
    "社会科学基础",
    "设计思维",
    "系统建模",
    "科技伦理",
    "协作式问题解决",
  ],
};

const genericPracticeTitles = [
  "专业认知与场域观察",
  "实验、田野与工作坊实践",
  "社会调查与公共服务",
  "行业实习与职业实践",
  "科研训练Ⅰ",
  "科研训练Ⅱ",
  "创新创业实践",
  "跨学科联合项目",
  "国际与跨文化实践",
  "毕业研究开题",
  "毕业成果制作",
];

const medicalPracticeTitles = [
  "基础医学综合实验",
  "临床技能训练",
  "内科见习",
  "外科见习",
  "妇产与儿科见习",
  "社区与全科医学实践",
  "临床轮转Ⅰ",
  "临床轮转Ⅱ",
  "临床轮转Ⅲ",
  "临床轮转Ⅳ",
  "医学科研训练",
];

const applicationProfiles: Record<
  string,
  {
    workFields: [string, string, string, string];
    ventureFields: [string, string, string];
    context: string;
  }
> = {
  文学: {
    workFields: ["研究与知识编辑", "文化内容与出版", "公共叙事与品牌", "博物馆与文化机构"],
    ventureFields: ["知识产品", "文化内容品牌", "公共文化服务"],
    context: "文本、历史材料与公共叙事",
  },
  法学: {
    workFields: ["法律与合规", "公共政策与研究", "组织治理", "国际事务与社会创新"],
    ventureFields: ["合规科技", "公共服务创新", "社会影响力组织"],
    context: "制度、利益相关者与公共选择",
  },
  管理学: {
    workFields: ["产品与增长", "战略与经营分析", "组织与人才", "投资与商业运营"],
    ventureFields: ["新产品验证", "商业模式设计", "组织规模化"],
    context: "顾客、组织、资本与竞争环境",
  },
  教育学: {
    workFields: ["学习产品设计", "课程与教学", "人才发展", "教育研究与政策"],
    ventureFields: ["教育科技", "职业学习服务", "学习型组织"],
    context: "学习者、教学活动与评价证据",
  },
  理学: {
    workFields: ["科学研究", "数据建模与分析", "量化决策", "科研工程与技术咨询"],
    ventureFields: ["科学计算工具", "深科技研发", "数据密集型产品"],
    context: "可测量现象、模型与实验数据",
  },
  医学: {
    workFields: ["生命科学研究", "临床与健康服务", "公共卫生", "医药与健康科技"],
    ventureFields: ["数字健康", "生物技术", "健康服务创新"],
    context: "生命过程、健康风险与临床证据",
  },
  工学: {
    workFields: ["产品研发", "系统工程", "制造与交付", "技术管理与安全"],
    ventureFields: ["工程技术产品", "产业数字化", "硬科技创业"],
    context: "需求、约束、材料与可验证系统",
  },
  艺术学: {
    workFields: ["视觉与交互设计", "内容创作", "品牌与体验", "文化艺术机构"],
    ventureFields: ["创意工作室", "数字内容产品", "文化体验品牌"],
    context: "受众、媒介、形式与体验",
  },
  交叉学科: {
    workFields: ["复杂问题研究", "跨职能产品", "创新战略", "技术与社会治理"],
    ventureFields: ["跨学科新产品", "前沿技术转化", "社会创新"],
    context: "多学科证据、系统关系与现实约束",
  },
};

function getApplicationProfile(discipline: string) {
  return applicationProfiles[discipline] ?? applicationProfiles["交叉学科"];
}

function makeProgramApplication(
  program: ProgramSeed,
  discipline: string,
): ProgramApplication {
  const profile = getApplicationProfile(discipline);
  return {
    capabilities: [
      `用${program.topics[0]}识别问题的关键结构`,
      `把${program.topics[1]}转化为可检验的分析`,
      `运用${program.topics[2]}比较方案并作出选择`,
      `以${program.topics[3]}完成跨情境的综合判断`,
    ],
    workFields: profile.workFields,
    ventureFields: profile.ventureFields,
    portfolio: [
      `一份围绕真实问题的${program.name}研究报告`,
      `一个可以被他人使用或验证的${program.name}实践成果`,
      `一套记录假设、证据、决策与复盘的专业档案`,
    ],
    boundary: `它不会替你提供唯一职业答案；它训练你在${profile.context}中提出更好的问题、寻找证据并承担判断的后果。`,
  };
}

function makeCourseApplication(
  title: string,
  category: CreditBandLabel,
  program: ProgramSeed,
  discipline: string,
): CourseApplication {
  const profile = getApplicationProfile(discipline);
  const categoryIntent: Record<
    CreditBandLabel,
    { action: string; artifact: string; boundary: string }
  > = {
    大学通识: {
      action: "建立跨专业都能使用的基础判断",
      artifact: "一份可以复用的问题分析备忘录",
      boundary: "通识方法用于照亮问题，不应替代具体领域的事实核查与专业责任。",
    },
    学院基础: {
      action: `读懂${discipline}共同体使用的语言和证据`,
      artifact: `一份${discipline}方法分析报告`,
      boundary: "基础方法能提高判断质量，但不能把复杂现实压缩成一个公式或单一指标。",
    },
    专业核心: {
      action: `形成${program.name}中可迁移的专业判断`,
      artifact: `一份围绕“${title}”的专业决策方案`,
      boundary: "框架是思考的脚手架；当情境、证据或利益相关者改变时，结论必须重新推导。",
    },
    方向选修: {
      action: "深入一个具体方向并与主修能力连接",
      artifact: `一份“${title}”方向研究或原型`,
      boundary: "专题知识更新很快，需要持续校验资料来源、适用时间和具体场景。",
    },
    实践与毕业: {
      action: "把知识放进真实约束并接受外部检验",
      artifact: `一个可展示、可复盘的${program.name}实践成果`,
      boundary: "作品完成不是学习终点；必须保留失败记录、反馈证据与下一轮改进计划。",
    },
  };
  const intent = categoryIntent[category];
  return {
    questions: [
      `面对与“${title}”有关的现实问题，哪些信息真正影响判断？`,
      `如何把${program.name}知识转化为可验证的行动，而不只停留在概念上？`,
    ],
    workScenes: [
      `在${profile.workFields[0]}中，用它${intent.action}`,
      `在${profile.workFields[1]}中，比较方案、解释证据并与他人协作`,
    ],
    ventureScenes: [
      `在${profile.ventureFields[0]}中验证需求、假设或技术路线`,
      `在${profile.ventureFields[1]}中识别风险、资源约束与下一步实验`,
    ],
    deliverable: intent.artifact,
    boundary: intent.boundary,
  };
}

function splitCredits(total: number, count: number) {
  const base = Math.floor(total / count);
  const remainder = total % count;
  return Array.from(
    { length: count },
    (_, index) => base + (index < remainder ? 1 : 0),
  );
}

function makeCreditPlan(total: number, discipline: string): CreditBand[] {
  const engineering = ["工学", "理学", "医学"].includes(discipline);
  const university = 42;
  const foundation = engineering ? 42 : 34;
  const core = 32;
  const elective = engineering ? 22 : 20;
  const practice = total - university - foundation - core - elective;
  return [
    {
      label: "大学通识",
      credits: university,
      description: "写作、数理、人文、科技伦理与跨学科素养",
    },
    {
      label: "学院基础",
      credits: foundation,
      description: "进入本学科共同体所需的方法与基础训练",
    },
    {
      label: "专业核心",
      credits: core,
      description: "构成专业判断力的核心课程组",
    },
    {
      label: "方向选修",
      credits: elective,
      description: "根据问题与职业方向自由组合",
    },
    {
      label: "实践与毕业",
      credits: practice,
      description: "研究项目、实践作品与毕业答辩",
    },
  ];
}

function makeCourses(
  schoolIndex: number,
  programIndex: number,
  program: ProgramSeed,
  discipline: string,
): UniversityCourse[] {
  const plan = makeCreditPlan(program.credits, discipline);
  const definitions: Array<
    Omit<
      UniversityCourse,
      | "code"
      | "availability"
      | "application"
      | "identityKey"
      | "rigorLevel"
      | "curriculumVersion"
    >
  > = [];
  const pushCourses = (
    category: CreditBandLabel,
    slugPrefix: string,
    items: Array<{ title: string; credits: number }>,
    examWeight = 60,
  ) => {
    items.forEach((item, index) => {
      definitions.push({
        slug: `${program.slug}-${slugPrefix}-${index + 1}`,
        title: item.title,
        credits: item.credits,
        category,
        summary: `通过对话、案例与练习掌握“${item.title}”，并将其纳入${program.name}培养路径。`,
        examWeight,
      });
    });
  };

  pushCourses(
    "大学通识",
    "general",
    generalEducationCourses.map((course) => ({ ...course })),
  );

  const foundationCredits =
    plan.find((band) => band.label === "学院基础")?.credits ?? 0;
  const foundationCount = foundationCredits === 42 ? 11 : 10;
  const foundationTitles =
    foundationTitlesByDiscipline[discipline] ??
    foundationTitlesByDiscipline["交叉学科"];
  pushCourses(
    "学院基础",
    "foundation",
    foundationTitles.slice(0, foundationCount).map((title, index) => ({
      title,
      credits: splitCredits(foundationCredits, foundationCount)[index],
    })),
  );

  const coreTitles = [
    `${program.name}导论`,
    `${program.name}研究方法`,
    ...program.topics,
    `${program.name}前沿专题研讨`,
    `${program.name}综合研究`,
  ];
  const coreCredits = [3, 3, 4, 4, 4, 4, 4, 6];
  coreTitles.forEach((title, index) => {
    definitions.push({
      slug: `${program.slug}-${index + 1}`,
      title,
      credits: coreCredits[index],
      category: "专业核心",
      summary: `通过对话、案例与练习建立“${title}”的可迁移专业判断框架。`,
      examWeight: 60,
    });
  });

  const electiveCredits =
    plan.find((band) => band.label === "方向选修")?.credits ?? 0;
  const electiveTitles = [
    ...program.topics.map((topic) => `${topic}进阶专题`),
    `${program.name}跨学科联合专题`,
    `${program.name}国际前沿专题`,
  ];
  pushCourses(
    "方向选修",
    "elective",
    electiveTitles.map((title, index) => ({
      title,
      credits: splitCredits(electiveCredits, electiveTitles.length)[index],
    })),
  );

  const practiceCredits =
    plan.find((band) => band.label === "实践与毕业")?.credits ?? 0;
  const practiceCount = Math.max(4, Math.ceil(practiceCredits / 6));
  const practiceTemplates =
    discipline === "医学" ? medicalPracticeTitles : genericPracticeTitles;
  const practiceTitles = [
    ...practiceTemplates.slice(0, practiceCount - 1),
    `${program.name}毕业论文（设计）与答辩`,
  ];
  pushCourses(
    "实践与毕业",
    "practice",
    practiceTitles.map((title, index) => ({
      title,
      credits: splitCredits(practiceCredits, practiceCount)[index],
    })),
    40,
  );

  return definitions.map((course, courseIndex) => ({
    ...course,
    identityKey: courseIdentityKey(course.title),
    rigorLevel: courseRigorLevel(course.category, discipline),
    curriculumVersion: "2026",
    application: makeCourseApplication(
      course.title,
      course.category,
      program,
      discipline,
    ),
    code: `AC${String(schoolIndex + 1).padStart(2, "0")}${String(
      programIndex + 1,
    ).padStart(2, "0")}${String(courseIndex + 1).padStart(2, "0")}`,
    availability: "planned",
  }));
}

const schoolSeeds: SchoolSeed[] = [
  {
    slug: "humanities",
    name: "人文学院",
    englishName: "School of Humanities",
    discipline: "文学",
    description: "理解思想、语言与历史如何塑造人的处境。",
    accent: "#8d5135",
    programs: [
      {
        slug: "philosophy",
        name: "哲学",
        degree: "哲学学士",
        credits: 146,
        description: "从逻辑、伦理与认识论训练概念辨析和论证能力。",
        topics: ["逻辑学", "伦理学", "认识论", "中国哲学史"],
      },
      {
        slug: "chinese-language-literature",
        name: "中国语言文学",
        degree: "文学学士",
        credits: 146,
        description: "在文本、语言与文化传统之间建立解释能力。",
        topics: ["古代文学", "现代文学", "语言学", "文学批评"],
      },
      {
        slug: "history",
        name: "历史学",
        degree: "历史学学士",
        credits: 146,
        description: "用史料、比较和因果解释理解长期变化。",
        topics: ["史学理论", "中国史", "世界史", "数字人文"],
      },
    ],
  },
  {
    slug: "social-sciences",
    name: "社会科学学院",
    englishName: "School of Social Sciences",
    discipline: "法学",
    description: "研究制度、群体与国家如何共同塑造社会。",
    accent: "#665785",
    programs: [
      {
        slug: "economics",
        name: "经济学",
        degree: "经济学学士",
        credits: 150,
        description: "理解激励、资源配置、增长与政策选择。",
        topics: ["微观经济学", "宏观经济学", "计量经济学", "发展经济学"],
      },
      {
        slug: "sociology",
        name: "社会学",
        degree: "法学学士",
        credits: 146,
        description: "从结构、网络与文化解释社会行为。",
        topics: ["社会理论", "社会研究方法", "组织社会学", "社会分层"],
      },
      {
        slug: "international-politics",
        name: "国际政治",
        degree: "法学学士",
        credits: 146,
        description: "理解国际秩序、国家行为与全球治理。",
        topics: ["国际关系理论", "比较政治", "外交政策", "全球治理"],
      },
    ],
  },
  {
    slug: "business",
    name: "商学院",
    englishName: "School of Business",
    discipline: "管理学",
    description: "把市场、组织、资本与战略放进同一张决策地图。",
    accent: "#9a4f18",
    programs: [
      {
        slug: "business-administration",
        name: "工商管理",
        degree: "管理学学士",
        credits: 150,
        description: "训练跨职能经营、组织设计与战略决策。",
        topics: ["管理学原理", "组织行为", "运营管理", "公司战略"],
      },
      {
        slug: "marketing",
        name: "市场营销",
        degree: "管理学学士",
        credits: 150,
        description: "从顾客、市场结构与增长问题出发建立营销判断。",
        topics: ["消费者行为", "市场研究", "品牌战略", "增长与渠道"],
      },
      {
        slug: "finance",
        name: "金融学",
        degree: "经济学学士",
        credits: 150,
        description: "理解风险、估值、资本结构与金融市场。",
        topics: ["公司金融", "投资学", "金融市场", "风险管理"],
      },
    ],
  },
  {
    slug: "law",
    name: "法学院",
    englishName: "School of Law",
    discipline: "法学",
    description: "在规则、事实与公共价值之间进行严谨论证。",
    accent: "#6e4932",
    programs: [
      {
        slug: "law-major",
        name: "法学",
        degree: "法学学士",
        credits: 150,
        description: "形成规范解释、事实认定与法律论证能力。",
        topics: ["宪法学", "民法学", "刑法学", "商法学"],
      },
      {
        slug: "intellectual-property",
        name: "知识产权",
        degree: "法学学士",
        credits: 150,
        description: "理解创新、技术交易与知识产权制度。",
        topics: ["著作权法", "专利法", "商标法", "技术合同"],
      },
    ],
  },
  {
    slug: "education",
    name: "教育学院",
    englishName: "School of Education",
    discipline: "教育学",
    description: "研究学习如何发生，以及怎样设计更好的教育系统。",
    accent: "#59715a",
    programs: [
      {
        slug: "education-studies",
        name: "教育学",
        degree: "教育学学士",
        credits: 146,
        description: "连接教育哲学、课程、评价与学校治理。",
        topics: ["教育学原理", "课程与教学", "教育评价", "教育政策"],
      },
      {
        slug: "learning-science",
        name: "学习科学",
        degree: "教育学学士",
        credits: 150,
        description: "以认知、技术与学习设计改善真实学习。",
        topics: ["教育心理学", "认知科学", "学习分析", "学习环境设计"],
      },
    ],
  },
  {
    slug: "sciences",
    name: "理学院",
    englishName: "School of Sciences",
    discipline: "理学",
    description: "用数学、实验与模型逼近自然世界的结构。",
    accent: "#3d6683",
    programs: [
      {
        slug: "mathematics",
        name: "数学与应用数学",
        degree: "理学学士",
        credits: 154,
        description: "训练抽象结构、严谨证明与数学建模。",
        topics: ["数学分析", "高等代数", "概率论", "数值分析"],
      },
      {
        slug: "physics",
        name: "物理学",
        degree: "理学学士",
        credits: 158,
        description: "从基本定律、实验与计算理解物质和能量。",
        topics: ["经典力学", "电磁学", "量子力学", "统计物理"],
      },
      {
        slug: "chemistry",
        name: "化学",
        degree: "理学学士",
        credits: 158,
        description: "理解物质结构、反应机制与实验方法。",
        topics: ["无机化学", "有机化学", "物理化学", "分析化学"],
      },
    ],
  },
  {
    slug: "life-health",
    name: "生命与健康学院",
    englishName: "School of Life & Health",
    discipline: "医学",
    description: "从分子、个体到人群理解生命与健康。",
    accent: "#4d725f",
    programs: [
      {
        slug: "biological-sciences",
        name: "生物科学",
        degree: "理学学士",
        credits: 158,
        description: "连接细胞、遗传、生态与生物信息。",
        topics: ["细胞生物学", "遗传学", "生物化学", "生态学"],
      },
      {
        slug: "psychology",
        name: "心理学",
        degree: "理学学士",
        credits: 154,
        description: "研究认知、发展、社会行为与心理测量。",
        topics: ["认知心理学", "发展心理学", "社会心理学", "心理测量"],
      },
      {
        slug: "public-health",
        name: "公共卫生",
        degree: "医学学士",
        credits: 160,
        description: "用流行病学、统计与政策改善人群健康。",
        topics: ["流行病学", "卫生统计学", "环境健康", "健康政策"],
      },
    ],
  },
  {
    slug: "computing",
    name: "计算与智能学院",
    englishName: "School of Computing & Intelligence",
    discipline: "工学",
    description: "构建计算系统，并理解智能的能力与边界。",
    accent: "#3f566e",
    programs: [
      {
        slug: "computer-science",
        name: "计算机科学与技术",
        degree: "工学学士",
        credits: 162,
        description: "从算法、系统到软件工程建立完整计算能力。",
        topics: ["数据结构与算法", "计算机系统", "操作系统", "软件工程"],
      },
      {
        slug: "artificial-intelligence",
        name: "人工智能",
        degree: "工学学士",
        credits: 158,
        description: "连接机器学习、认知、智能系统与伦理。",
        topics: ["机器学习", "深度学习", "自然语言处理", "智能体系统"],
      },
      {
        slug: "data-science",
        name: "数据科学",
        degree: "理学学士",
        credits: 154,
        description: "从数据工程、统计推断到因果决策。",
        topics: ["统计推断", "数据工程", "因果推断", "数据产品"],
      },
    ],
  },
  {
    slug: "engineering",
    name: "工学院",
    englishName: "School of Engineering",
    discipline: "工学",
    description: "把科学原理转化为可验证、可制造的系统。",
    accent: "#5c6670",
    programs: [
      {
        slug: "mechanical-engineering",
        name: "机械工程",
        degree: "工学学士",
        credits: 168,
        description: "理解力、材料、制造与复杂机械系统。",
        topics: ["工程力学", "机械设计", "制造技术", "控制工程"],
      },
      {
        slug: "electronic-information",
        name: "电子信息工程",
        degree: "工学学士",
        credits: 166,
        description: "连接电路、信号、通信与嵌入式系统。",
        topics: ["电路原理", "信号与系统", "通信原理", "嵌入式系统"],
      },
      {
        slug: "energy-environment",
        name: "能源与环境工程",
        degree: "工学学士",
        credits: 168,
        description: "研究能源转换、环境系统与可持续工程。",
        topics: ["热力学", "能源系统", "环境工程", "碳管理"],
      },
    ],
  },
  {
    slug: "architecture-design",
    name: "建筑与设计学院",
    englishName: "School of Architecture & Design",
    discipline: "工学",
    description: "在空间、技术、审美与人的体验之间创造。",
    accent: "#81644d",
    programs: [
      {
        slug: "architecture",
        name: "建筑学",
        degree: "建筑学学士",
        credits: 170,
        description: "结合空间设计、建造技术与城市历史。",
        topics: ["建筑设计", "建筑历史", "建筑技术", "城市设计"],
      },
      {
        slug: "industrial-design",
        name: "工业设计",
        degree: "工学学士",
        credits: 158,
        description: "从人、技术与商业约束中塑造产品体验。",
        topics: ["设计基础", "人机工程", "产品设计", "服务设计"],
      },
    ],
  },
  {
    slug: "media-arts",
    name: "传媒与艺术学院",
    englishName: "School of Media & Arts",
    discipline: "艺术学",
    description: "理解媒介如何塑造公共叙事、文化与体验。",
    accent: "#8b5368",
    programs: [
      {
        slug: "journalism-communication",
        name: "新闻传播学",
        degree: "文学学士",
        credits: 146,
        description: "训练事实核查、公共表达与媒介研究。",
        topics: ["新闻采写", "传播理论", "数据新闻", "媒介伦理"],
      },
      {
        slug: "digital-media-arts",
        name: "数字媒体艺术",
        degree: "艺术学学士",
        credits: 154,
        description: "结合叙事、视觉、交互与计算媒介。",
        topics: ["视觉叙事", "交互设计", "动态影像", "创意编程"],
      },
    ],
  },
  {
    slug: "public-governance",
    name: "公共治理学院",
    englishName: "School of Public Governance",
    discipline: "管理学",
    description: "把公共问题转化为可执行、可评估的治理行动。",
    accent: "#536c67",
    programs: [
      {
        slug: "public-administration",
        name: "公共管理",
        degree: "管理学学士",
        credits: 146,
        description: "理解政府、公共组织与政策执行。",
        topics: ["公共管理学", "公共政策分析", "公共财政", "项目评估"],
      },
      {
        slug: "urban-governance",
        name: "城市治理",
        degree: "管理学学士",
        credits: 150,
        description: "连接城市经济、空间规划、社区与数字治理。",
        topics: ["城市经济学", "城市规划", "社区治理", "数字政府"],
      },
    ],
  },
];

const additionalProgramsBySchool: Record<string, ProgramSeed[]> = {
  humanities: [
    {
      slug: "archaeology-museology",
      name: "考古学与博物馆学",
      degree: "历史学学士",
      credits: 150,
      description: "通过物质遗存、田野调查与展示叙事理解文明。",
      topics: ["考古学理论", "田野考古", "科技考古", "博物馆策展"],
    },
    {
      slug: "linguistics",
      name: "语言学",
      degree: "文学学士",
      credits: 146,
      description: "研究语言的结构、认知机制、社会变化与计算表达。",
      topics: ["语音与音系", "句法学", "社会语言学", "计算语言学"],
    },
    {
      slug: "classics",
      name: "古典学",
      degree: "文学学士",
      credits: 150,
      description: "跨越语言、历史与哲学研读古典文明及其现代回声。",
      topics: ["古典语言", "古典文献", "古代思想", "比较古典学"],
    },
  ],
  "social-sciences": [
    {
      slug: "political-science",
      name: "政治学",
      degree: "法学学士",
      credits: 146,
      description: "理解权力、制度、政治行为与公共秩序。",
      topics: ["政治学理论", "比较政治", "政治行为", "国家治理"],
    },
    {
      slug: "anthropology",
      name: "人类学",
      degree: "法学学士",
      credits: 146,
      description: "用民族志和比较视角理解文化、社会与人的多样性。",
      topics: ["人类学理论", "民族志方法", "文化人类学", "医学人类学"],
    },
    {
      slug: "population-studies",
      name: "人口与发展研究",
      degree: "法学学士",
      credits: 150,
      description: "连接人口变化、家庭、迁移、健康与发展政策。",
      topics: ["人口学", "人口统计", "迁移与城市化", "老龄社会"],
    },
  ],
  business: [
    {
      slug: "accounting",
      name: "会计学",
      degree: "管理学学士",
      credits: 150,
      description: "理解企业活动如何被计量、解释、审计与治理。",
      topics: ["财务会计", "管理会计", "审计学", "公司治理"],
    },
    {
      slug: "operations-supply-chain",
      name: "运营与供应链管理",
      degree: "管理学学士",
      credits: 154,
      description: "设计在不确定环境中稳定交付价值的运营系统。",
      topics: ["运营分析", "供应链设计", "质量管理", "服务运营"],
    },
    {
      slug: "entrepreneurship-innovation",
      name: "创业与创新管理",
      degree: "管理学学士",
      credits: 150,
      description: "从机会识别到组织增长，验证创新如何成为可持续事业。",
      topics: ["创业机会", "商业模式", "创新组织", "创业融资"],
    },
  ],
  law: [
    {
      slug: "international-law",
      name: "国际法",
      degree: "法学学士",
      credits: 154,
      description: "理解国家、组织、企业与个人在跨境秩序中的权利义务。",
      topics: ["国际公法", "国际经济法", "海洋法", "国际争端解决"],
    },
    {
      slug: "computational-law",
      name: "计算法学",
      degree: "法学学士",
      credits: 154,
      description: "把法律推理与数据、算法和数字治理结合。",
      topics: ["法律数据分析", "平台治理", "人工智能法", "隐私与安全"],
    },
  ],
  education: [
    {
      slug: "educational-technology",
      name: "教育技术",
      degree: "教育学学士",
      credits: 150,
      description: "用学习科学、交互设计与数据改善教育体验。",
      topics: ["教学设计", "学习技术", "教育数据", "智能教育"],
    },
    {
      slug: "education-policy",
      name: "教育政策与领导力",
      degree: "教育学学士",
      credits: 146,
      description: "理解教育制度、学校组织与公共政策如何共同作用。",
      topics: ["教育政策", "学校领导", "教育财政", "比较教育"],
    },
  ],
  sciences: [
    {
      slug: "statistics",
      name: "统计学",
      degree: "理学学士",
      credits: 154,
      description: "从不确定性、数据生成过程与因果推断建立证据。",
      topics: ["数理统计", "回归分析", "贝叶斯统计", "因果推断"],
    },
    {
      slug: "astronomy",
      name: "天文学",
      degree: "理学学士",
      credits: 158,
      description: "以观测、理论与计算研究宇宙的结构和演化。",
      topics: ["天体物理", "观测天文学", "恒星演化", "宇宙学"],
    },
    {
      slug: "paleontology",
      name: "古生物学",
      degree: "理学学士",
      credits: 158,
      description: "连接生命演化、地层记录、地球环境与数字重建。",
      topics: ["古生物学", "地层学", "演化生物学", "古环境重建"],
    },
  ],
  "life-health": [
    {
      slug: "human-biology",
      name: "人类生物学",
      degree: "理学学士",
      credits: 158,
      description: "跨越遗传、生理、行为、文化与健康政策理解人类。",
      topics: ["人类遗传学", "生理与发育", "行为与文化", "健康与社会"],
    },
    {
      slug: "neuroscience",
      name: "神经科学",
      degree: "理学学士",
      credits: 162,
      description: "从细胞、神经环路到认知和行为研究大脑。",
      topics: ["神经生物学", "系统神经科学", "认知神经科学", "计算神经科学"],
    },
    {
      slug: "biomedical-sciences",
      name: "生物医学科学",
      degree: "理学学士",
      credits: 162,
      description: "连接基础生命科学、疾病机制与转化研究。",
      topics: ["分子医学", "免疫学", "病理生理学", "转化医学"],
    },
  ],
  computing: [
    {
      slug: "software-engineering",
      name: "软件工程",
      degree: "工学学士",
      credits: 164,
      description: "设计可演进、可验证、可协作的大规模软件系统。",
      topics: ["软件设计", "软件测试", "分布式系统", "开发运维"],
    },
    {
      slug: "cybersecurity",
      name: "网络空间安全",
      degree: "工学学士",
      credits: 164,
      description: "理解计算系统、网络、数据与组织中的安全边界。",
      topics: ["密码学", "系统安全", "网络攻防", "安全治理"],
    },
    {
      slug: "integrated-circuits",
      name: "集成电路设计",
      degree: "工学学士",
      credits: 168,
      description: "从器件、电路、架构到设计自动化构建芯片系统。",
      topics: ["半导体器件", "模拟集成电路", "数字芯片设计", "EDA"],
    },
    {
      slug: "information-science",
      name: "信息科学与人机交互",
      degree: "工学学士",
      credits: 158,
      description: "研究信息如何被组织、交互、解释并转化为行动。",
      topics: ["信息行为", "人机交互", "信息可视化", "社会计算"],
    },
  ],
  engineering: [
    {
      slug: "electrical-engineering",
      name: "电气工程及其自动化",
      degree: "工学学士",
      credits: 170,
      description: "理解电能、控制、电子与复杂电力系统。",
      topics: ["电路原理", "电机与电力电子", "电力系统", "智能电网"],
    },
    {
      slug: "automation-robotics",
      name: "自动化与机器人",
      degree: "工学学士",
      credits: 168,
      description: "让感知、决策、控制和机械系统协同工作。",
      topics: ["自动控制", "机器人学", "机器感知", "自主系统"],
    },
    {
      slug: "materials-science",
      name: "材料科学与工程",
      degree: "工学学士",
      credits: 168,
      description: "连接材料结构、性能、制造和可持续应用。",
      topics: ["材料物理", "材料化学", "材料表征", "先进制造"],
    },
    {
      slug: "chemical-engineering",
      name: "化学工程与工业生物工程",
      degree: "工学学士",
      credits: 170,
      description: "把化学和生物过程转化为安全高效的工业系统。",
      topics: ["化工原理", "反应工程", "过程系统", "工业生物技术"],
    },
    {
      slug: "aerospace-engineering",
      name: "航空航天工程",
      degree: "工学学士",
      credits: 170,
      description: "综合力学、控制、材料与计算设计飞行系统。",
      topics: ["空气动力学", "飞行器结构", "推进原理", "航天器控制"],
    },
    {
      slug: "bioengineering",
      name: "生物工程",
      degree: "工学学士",
      credits: 168,
      description: "用工程设计解决生命科学、医疗与生物制造问题。",
      topics: ["生物材料", "生物传感", "组织工程", "合成生物学"],
    },
    {
      slug: "civil-ocean-engineering",
      name: "土木、水利与海洋工程",
      degree: "工学学士",
      credits: 170,
      description: "建设安全、韧性、可持续的陆地与海洋基础设施。",
      topics: ["结构工程", "岩土工程", "水利工程", "海洋工程"],
    },
  ],
  "architecture-design": [
    {
      slug: "urban-rural-planning",
      name: "城乡规划",
      degree: "工学学士",
      credits: 176,
      duration: "5 年制",
      description: "连接空间、交通、经济、生态与公共参与塑造城乡未来。",
      topics: ["规划原理", "城市设计", "区域规划", "规划政策"],
    },
    {
      slug: "landscape-architecture",
      name: "风景园林",
      degree: "工学学士",
      credits: 176,
      duration: "5 年制",
      description: "以生态、空间和文化设计人与自然的关系。",
      topics: ["景观设计", "植物与生态", "场地工程", "景观遗产"],
    },
  ],
  "media-arts": [
    {
      slug: "art-history",
      name: "艺术史论",
      degree: "艺术学学士",
      credits: 146,
      description: "在作品、制度、社会与观念之间建立视觉解释。",
      topics: ["中国艺术史", "西方艺术史", "视觉文化", "策展研究"],
    },
    {
      slug: "visual-arts",
      name: "视觉艺术",
      degree: "艺术学学士",
      credits: 154,
      description: "通过材料、图像和空间形成个人创作语言。",
      topics: ["绘画与图像", "雕塑与装置", "摄影", "当代艺术实践"],
    },
    {
      slug: "theater-performance",
      name: "戏剧与表演研究",
      degree: "艺术学学士",
      credits: 150,
      description: "连接文本、身体、舞台、社会与现场创作。",
      topics: ["戏剧史", "表演方法", "导演基础", "剧场制作"],
    },
  ],
  "public-governance": [
    {
      slug: "public-policy",
      name: "公共政策",
      degree: "管理学学士",
      credits: 150,
      description: "用经济、政治、伦理与证据评估公共选择。",
      topics: ["政策分析", "公共经济学", "政策评估", "政策沟通"],
    },
    {
      slug: "ppe",
      name: "政治学、经济学与哲学（PPE）",
      degree: "法学学士",
      credits: 154,
      description: "从制度、激励与价值三个维度分析复杂公共问题。",
      topics: ["政治哲学", "微观经济学", "制度分析", "公共伦理"],
    },
    {
      slug: "information-management",
      name: "信息管理与数字治理",
      degree: "管理学学士",
      credits: 150,
      description: "设计公共与组织信息的采集、管理、开放和治理。",
      topics: ["信息组织", "数字政府", "数据治理", "知识管理"],
    },
  ],
};

for (const school of schoolSeeds) {
  school.programs.push(...(additionalProgramsBySchool[school.slug] ?? []));
}

schoolSeeds.push(
  {
    slug: "languages-global-studies",
    name: "外国语言与全球研究学院",
    englishName: "School of Languages & Global Studies",
    discipline: "文学",
    description: "通过语言进入不同文明，并理解区域与全球关系。",
    accent: "#6f5a7e",
    programs: [
      {
        slug: "english-literature",
        name: "英语语言文学",
        degree: "文学学士",
        credits: 146,
        description: "连接语言能力、文学传统、文化研究与全球表达。",
        topics: ["高级英语", "英语文学", "语言与文化", "学术写作"],
      },
      {
        slug: "translation-interpretation",
        name: "翻译与跨文化传播",
        degree: "文学学士",
        credits: 150,
        description: "在语言、专业知识与文化语境之间进行准确转换。",
        topics: ["翻译理论", "笔译实践", "口译实践", "本地化传播"],
      },
      {
        slug: "east-asian-studies",
        name: "东亚研究",
        degree: "文学学士",
        credits: 150,
        description: "跨越语言、历史、政治与经济理解东亚。",
        topics: ["东亚历史", "东亚政治", "区域经济", "东亚文化"],
      },
      {
        slug: "middle-eastern-studies",
        name: "中东研究",
        degree: "文学学士",
        credits: 150,
        description: "从语言、宗教、历史和国际关系理解中东。",
        topics: ["阿拉伯语", "中东历史", "宗教与社会", "中东政治"],
      },
      {
        slug: "global-studies",
        name: "全球研究",
        degree: "文学学士",
        credits: 150,
        description: "研究跨国流动、全球不平等、文化与治理。",
        topics: ["全球史", "跨国迁移", "全球文化", "国际发展"],
      },
    ],
  },
  {
    slug: "medicine",
    name: "医学院",
    englishName: "School of Medicine",
    discipline: "医学",
    description: "把基础科学、临床判断、患者体验与公共责任结合。",
    accent: "#8b4f55",
    programs: [
      {
        slug: "clinical-medicine",
        name: "临床医学",
        degree: "医学学士",
        credits: 200,
        duration: "8 年贯通",
        description: "从人体系统、疾病机制到循证诊疗形成临床判断。",
        topics: ["内科学", "外科学", "诊断学", "临床决策"],
      },
      {
        slug: "stomatology",
        name: "口腔医学",
        degree: "医学学士",
        credits: 190,
        duration: "5 年制",
        description: "研究口腔颌面系统的健康、疾病、修复与预防。",
        topics: ["口腔基础医学", "口腔内科学", "口腔颌面外科", "修复与正畸"],
      },
      {
        slug: "pharmacy",
        name: "药学",
        degree: "理学学士",
        credits: 168,
        description: "连接药物发现、制剂、作用机制和临床使用。",
        topics: ["药物化学", "药理学", "药剂学", "临床药学"],
      },
      {
        slug: "nursing",
        name: "护理学",
        degree: "理学学士",
        credits: 166,
        description: "以患者和家庭为中心进行连续、循证的健康照护。",
        topics: ["基础护理", "成人护理", "母婴护理", "社区护理"],
      },
      {
        slug: "medical-imaging",
        name: "医学影像与智能诊断",
        degree: "医学学士",
        credits: 174,
        duration: "5 年制",
        description: "结合影像物理、人体解剖、临床医学与人工智能。",
        topics: ["影像物理", "断层解剖", "影像诊断", "医学影像 AI"],
      },
      {
        slug: "global-health",
        name: "全球健康",
        degree: "医学学士",
        credits: 164,
        description: "跨越疾病、卫生系统、发展与国际协作改善健康公平。",
        topics: ["全球疾病负担", "卫生系统", "健康公平", "全球健康治理"],
      },
    ],
  },
  {
    slug: "sustainability-earth",
    name: "地球与可持续发展学院",
    englishName: "School of Sustainability & Earth",
    discipline: "交叉学科",
    description: "理解地球系统，并设计面向气候、能源与海洋的解决方案。",
    accent: "#3d7269",
    programs: [
      {
        slug: "earth-systems",
        name: "地球系统",
        degree: "理学学士",
        credits: 158,
        description: "综合气候、生态、地质与人类活动理解地球变化。",
        topics: ["地球系统科学", "气候过程", "生态系统", "环境变化"],
      },
      {
        slug: "earth-planetary-sciences",
        name: "地球与行星科学",
        degree: "理学学士",
        credits: 162,
        description: "研究地球与行星的物质、历史、过程和宜居性。",
        topics: ["矿物与岩石", "构造地质", "行星科学", "地球化学"],
      },
      {
        slug: "environmental-science-engineering",
        name: "环境科学与工程",
        degree: "工学学士",
        credits: 168,
        description: "理解污染、生态风险并设计环境治理系统。",
        topics: ["环境化学", "水处理", "大气污染控制", "环境系统分析"],
      },
      {
        slug: "energy-science-engineering",
        name: "能源科学与工程",
        degree: "工学学士",
        credits: 168,
        description: "从转换、储存、网络和政策推动能源系统转型。",
        topics: ["能源转换", "储能技术", "能源系统", "能源政策"],
      },
      {
        slug: "geophysics",
        name: "地球物理学",
        degree: "理学学士",
        credits: 162,
        description: "利用物理观测、计算和反演理解地球内部与灾害。",
        topics: ["地震学", "重磁学", "地球物理反演", "自然灾害"],
      },
      {
        slug: "ocean-science",
        name: "海洋科学与技术",
        degree: "理学学士",
        credits: 164,
        description: "结合海洋过程、生态、观测技术与治理。",
        topics: ["物理海洋学", "海洋生态", "海洋观测", "海洋治理"],
      },
    ],
  },
  {
    slug: "interdisciplinary",
    name: "交叉科学学院",
    englishName: "School of Interdisciplinary Studies",
    discipline: "交叉学科",
    description: "让新问题决定知识组合，而不是让传统院系决定问题。",
    accent: "#775a3e",
    programs: [
      {
        slug: "symbolic-systems",
        name: "符号系统",
        degree: "理学学士",
        credits: 154,
        description: "连接计算、语言、逻辑、认知与人工智能。",
        topics: ["符号与计算", "认知科学", "语言与心智", "人工智能哲学"],
      },
      {
        slug: "computational-social-science",
        name: "计算社会科学",
        degree: "理学学士",
        credits: 154,
        description: "用计算、网络和因果方法研究社会行为与制度。",
        topics: ["社会数据科学", "网络科学", "计算实验", "数字社会"],
      },
      {
        slug: "science-technology-society",
        name: "科学、技术与社会",
        degree: "文学学士",
        credits: 150,
        description: "研究知识、技术、制度与公共价值如何共同演化。",
        topics: ["科学史", "技术哲学", "创新制度", "科技伦理"],
      },
      {
        slug: "bioinformatics",
        name: "生物信息学",
        degree: "理学学士",
        credits: 162,
        description: "结合生物学、统计与计算理解生命数据。",
        topics: ["基因组学", "生物统计", "计算生物学", "系统生物学"],
      },
      {
        slug: "integrated-science",
        name: "整合科学",
        degree: "理学学士",
        credits: 160,
        description: "跨越物理、化学与生命科学研究复杂自然系统。",
        topics: ["数理基础", "化学生物学", "复杂系统", "科学实验设计"],
      },
      {
        slug: "design-technology",
        name: "设计与技术",
        degree: "工学学士",
        credits: 158,
        description: "把工程、计算、产品设计与社会需求合成解决方案。",
        topics: ["设计研究", "交互原型", "产品工程", "负责任创新"],
      },
    ],
  },
  {
    slug: "sports-human-performance",
    name: "体育与人体运动学院",
    englishName: "School of Sport & Human Performance",
    discipline: "教育学",
    description: "理解运动、身体、健康与高水平表现。",
    accent: "#526d78",
    programs: [
      {
        slug: "sports-science",
        name: "运动科学",
        degree: "教育学学士",
        credits: 150,
        description: "用生理、力学、心理与数据理解人体运动。",
        topics: ["运动生理学", "运动生物力学", "运动心理学", "运动数据分析"],
      },
      {
        slug: "physical-education",
        name: "体育教育",
        degree: "教育学学士",
        credits: 150,
        description: "设计促进终身运动、健康和社会发展的体育教育。",
        topics: ["体育教学", "运动技能学习", "学校体育", "健康教育"],
      },
      {
        slug: "sports-management",
        name: "体育管理",
        degree: "管理学学士",
        credits: 146,
        description: "理解体育组织、赛事、产业和公共价值。",
        topics: ["体育组织", "赛事管理", "体育营销", "体育政策"],
      },
    ],
  },
);

export const universitySchools: UniversitySchool[] = schoolSeeds.map(
  (school, schoolIndex) => ({
    ...school,
    programs: school.programs.map((program, programIndex) => ({
      slug: program.slug,
      schoolSlug: school.slug,
      name: program.name,
      degree: program.degree,
      duration: program.duration ?? "4 年制",
      requiredCredits: program.credits,
      description: program.description,
      application: makeProgramApplication(program, school.discipline),
      creditPlan: makeCreditPlan(program.credits, school.discipline),
      courses: makeCourses(
        schoolIndex,
        programIndex,
        program,
        school.discipline,
      ),
    })),
  }),
);

const marketing = universitySchools
  .find((school) => school.slug === "business")
  ?.programs.find((program) => program.slug === "marketing");

if (marketing) {
  const marketingPrinciples = marketing.courses.findIndex(
    (course) => course.slug === "marketing-1",
  );
  const marketingStrategy = marketing.courses.findIndex(
    (course) => course.slug === "marketing-3",
  );
  const marketingInnovation = marketing.courses.findIndex(
    (course) => course.slug === "marketing-5",
  );
  marketing.courses[marketingPrinciples] = {
    ...marketing.courses[marketingPrinciples],
    slug: "4p-stp",
    code: "AC030201",
    title: "市场营销原理：4P 与 STP",
    credits: 3,
    identityKey: courseIdentityKey("市场营销原理：4P 与 STP"),
    rigorLevel: 320,
    availability: "open",
    summary: "从一个真实增长问题出发，辨认 Product、Price、Place 与 Promotion。",
  };
  marketing.courses[marketingStrategy] = {
    ...marketing.courses[marketingStrategy],
    slug: "porter-five-forces",
    code: "AC030203",
    title: "竞争战略：Porter 五力",
    credits: 4,
    identityKey: courseIdentityKey("竞争战略：Porter 五力"),
    rigorLevel: 320,
    availability: "open",
    summary: "判断产业结构如何分配利润，以及真正的竞争压力来自哪里。",
  };
  marketing.courses[marketingInnovation] = {
    ...marketing.courses[marketingInnovation],
    slug: "disruptive-innovation",
    code: "AC030205",
    title: "创新管理：颠覆式创新",
    credits: 4,
    identityKey: courseIdentityKey("创新管理：颠覆式创新"),
    rigorLevel: 320,
    availability: "open",
    summary: "理解优秀企业为什么会在持续服务主流客户时错失变化。",
  };
}

export const universityStats = {
  schools: universitySchools.length,
  programs: universitySchools.reduce(
    (total, school) => total + school.programs.length,
    0,
  ),
  courses: universitySchools.reduce(
    (total, school) =>
      total +
      school.programs.reduce(
        (programTotal, program) => programTotal + program.courses.length,
        0,
      ),
    0,
  ),
  minCredits: Math.min(
    ...universitySchools.flatMap((school) =>
      school.programs.map((program) => program.requiredCredits),
    ),
  ),
  maxCredits: Math.max(
    ...universitySchools.flatMap((school) =>
      school.programs.map((program) => program.requiredCredits),
    ),
  ),
};

export function getUniversitySchool(slug: string) {
  return universitySchools.find((school) => school.slug === slug);
}

export function getUniversityProgram(slug: string) {
  return universitySchools
    .flatMap((school) => school.programs)
    .find((program) => program.slug === slug);
}

export function getUniversityCourse(slug: string) {
  for (const school of universitySchools) {
    for (const program of school.programs) {
      const course = program.courses.find((item) => item.slug === slug);
      if (course) return { course, program, school };
    }
  }
  return null;
}

export function getAllUniversityCourses() {
  return universitySchools.flatMap((school) =>
    school.programs.flatMap((program) =>
      program.courses.map((course) => ({ course, program, school })),
    ),
  );
}

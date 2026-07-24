export type CreditBand = {
  label: string;
  credits: number;
  description: string;
};

export type UniversityCourse = {
  slug: string;
  code: string;
  title: string;
  credits: number;
  category: "基础必修" | "专业核心" | "专题研讨" | "毕业项目";
  summary: string;
  examWeight: number;
  availability: "open" | "planned";
};

export type UniversityProgram = {
  slug: string;
  schoolSlug: string;
  name: string;
  degree: string;
  duration: string;
  requiredCredits: number;
  description: string;
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
  topics: [string, string, string, string];
};

type SchoolSeed = Omit<UniversitySchool, "programs"> & {
  programs: ProgramSeed[];
};

const courseCredits = [3, 3, 4, 4, 4, 4, 4, 6] as const;

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
): UniversityCourse[] {
  const number = (courseIndex: number) =>
    `${String(schoolIndex + 1).padStart(2, "0")}${String(
      programIndex + 1,
    ).padStart(2, "0")}${courseIndex + 1}`;
  const definitions = [
    `${program.name}导论`,
    `${program.name}研究方法`,
    ...program.topics,
    `${program.name}前沿专题研讨`,
    `${program.name}毕业研究项目`,
  ];
  return definitions.map((title, index) => ({
    slug: `${program.slug}-${index + 1}`,
    code: `AC${number(index)}`,
    title,
    credits: courseCredits[index],
    category:
      index < 2
        ? "基础必修"
        : index < 6
          ? "专业核心"
          : index === 6
            ? "专题研讨"
            : "毕业项目",
    summary:
      index === 7
        ? `围绕真实问题完成一项可答辩、可复盘的${program.name}研究。`
        : `通过对话、案例与练习建立“${title}”的可迁移判断框架。`,
    examWeight: index === 7 ? 40 : 60,
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

export const universitySchools: UniversitySchool[] = schoolSeeds.map(
  (school, schoolIndex) => ({
    ...school,
    programs: school.programs.map((program, programIndex) => ({
      slug: program.slug,
      schoolSlug: school.slug,
      name: program.name,
      degree: program.degree,
      duration: "4 年制",
      requiredCredits: program.credits,
      description: program.description,
      creditPlan: makeCreditPlan(program.credits, school.discipline),
      courses: makeCourses(schoolIndex, programIndex, program),
    })),
  }),
);

const marketing = universitySchools
  .find((school) => school.slug === "business")
  ?.programs.find((program) => program.slug === "marketing");

if (marketing) {
  marketing.courses[0] = {
    ...marketing.courses[0],
    slug: "4p-stp",
    code: "AC030201",
    title: "市场营销原理：4P 与 STP",
    credits: 3,
    availability: "open",
    summary: "从一个真实增长问题出发，辨认 Product、Price、Place 与 Promotion。",
  };
  marketing.courses[2] = {
    ...marketing.courses[2],
    slug: "porter-five-forces",
    code: "AC030203",
    title: "竞争战略：Porter 五力",
    credits: 4,
    availability: "open",
    summary: "判断产业结构如何分配利润，以及真正的竞争压力来自哪里。",
  };
  marketing.courses[4] = {
    ...marketing.courses[4],
    slug: "disruptive-innovation",
    code: "AC030205",
    title: "创新管理：颠覆式创新",
    credits: 4,
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

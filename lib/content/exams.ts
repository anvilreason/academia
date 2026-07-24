export type ExamQuestion = {
  prompt: string;
  choices: string[];
  correctIndex: number;
  topic: string;
};

const exams: Record<string, ExamQuestion[]> = {
  "4p-stp": [
    {
      prompt: "在 4P 中，用户为获得产品所付出的全部代价最接近哪一项？",
      choices: ["Product", "Price", "Place", "Promotion"],
      correctIndex: 1,
      topic: "Price 与顾客总代价",
    },
    {
      prompt: "STP 的第一步是什么？",
      choices: ["定位", "细分市场", "选择渠道", "制定价格"],
      correctIndex: 1,
      topic: "市场细分",
    },
    {
      prompt: "判断增长卡在 Promotion 前，最应该先确认什么？",
      choices: ["广告预算", "品牌颜色", "目标顾客与价值主张", "竞品口号"],
      correctIndex: 2,
      topic: "目标市场与价值主张",
    },
    {
      prompt: "Place 主要讨论什么？",
      choices: ["产品功能", "触达与交付渠道", "定价心理", "传播内容"],
      correctIndex: 1,
      topic: "渠道与交付",
    },
    {
      prompt: "有效定位最需要同时满足哪一组条件？",
      choices: ["宏大且抽象", "对目标客群有意义且与替代方案不同", "价格最低", "渠道最多"],
      correctIndex: 1,
      topic: "定位差异化",
    },
  ],
  "porter-five-forces": [
    {
      prompt: "五力分析首先回答的核心问题是什么？",
      choices: ["谁广告最多", "产业结构如何影响利润", "谁产品功能最多", "谁融资最多"],
      correctIndex: 1,
      topic: "产业结构与利润",
    },
    {
      prompt: "客户转换成本下降，通常会增强哪一种力量？",
      choices: ["买方议价能力", "供应商议价能力", "进入壁垒", "企业内部协同"],
      correctIndex: 0,
      topic: "买方议价能力",
    },
    {
      prompt: "替代品威胁最容易被哪一种分析误区忽略？",
      choices: ["只盯直接竞争对手", "关注利润池", "分析客户任务", "观察技术变化"],
      correctIndex: 0,
      topic: "替代品威胁",
    },
    {
      prompt: "规模经济最可能影响哪一种力量？",
      choices: ["新进入者威胁", "买方集中度", "替代品价格", "组织文化"],
      correctIndex: 0,
      topic: "进入壁垒",
    },
    {
      prompt: "供应商高度集中而买方分散，通常意味着什么？",
      choices: ["供应商议价能力更强", "买方议价能力更强", "没有结构性影响", "替代品必然增加"],
      correctIndex: 0,
      topic: "供应商议价能力",
    },
  ],
  "disruptive-innovation": [
    {
      prompt: "颠覆式创新通常从哪里开始？",
      choices: ["主流市场最高端", "低端或新市场立足点", "政府采购", "最大客户"],
      correctIndex: 1,
      topic: "颠覆的立足点",
    },
    {
      prompt: "优秀公司错过颠覆者的常见原因是什么？",
      choices: ["不重视客户", "资源配置合理地偏向高价值主流客户", "员工太少", "技术专利太多"],
      correctIndex: 1,
      topic: "资源依赖",
    },
    {
      prompt: "“低端颠覆”首先服务哪类用户？",
      choices: ["过度服务的低端用户", "最高利润客户", "所有用户", "政府用户"],
      correctIndex: 0,
      topic: "低端颠覆",
    },
    {
      prompt: "价值网络决定了什么？",
      choices: ["企业评价机会与配置资源的方式", "公司注册地", "员工数量", "品牌字体"],
      correctIndex: 0,
      topic: "价值网络",
    },
    {
      prompt: "判断一个创新是否颠覆性，最不应只看什么？",
      choices: ["进入路径", "商业模式", "技术是否先进", "目标用户"],
      correctIndex: 2,
      topic: "颠覆与技术先进性",
    },
  ],
};

export function examForNode(nodeSlug: string) {
  return exams[nodeSlug] ?? null;
}

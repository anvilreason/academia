export type LearningNode = {
  slug: "4p-stp" | "porter-five-forces" | "disruptive-innovation";
  title: string;
  professor: string;
  school: string;
  level: "本科基础" | "MBA 深度";
  access: "free" | "paid";
  priceYuan: number;
  duration: string;
  question: string;
  description: string;
};

export const nodes: LearningNode[] = [
  {
    slug: "4p-stp",
    title: "4P 与 STP：增长究竟卡在哪里",
    professor: "Philip Kotler",
    school: "Kellogg",
    level: "本科基础",
    access: "free",
    priceYuan: 0,
    duration: "约 45 分钟",
    question: "产品、价格、渠道与传播，哪一个才是你真正的问题？",
    description:
      "从一个真实增长问题出发，建立不会轻易塌掉的营销判断框架。",
  },
  {
    slug: "porter-five-forces",
    title: "Porter 五力：你面对的真的是竞争吗",
    professor: "Michael Porter",
    school: "Harvard Business School",
    level: "MBA 深度",
    access: "paid",
    priceYuan: 99,
    duration: "约 90 分钟",
    question: "把竞争对手盯得太紧，会不会正让你忽略真正的威胁？",
    description:
      "把五力从一张模板，还原成用于判断产业结构与利润来源的思考工具。",
  },
  {
    slug: "disruptive-innovation",
    title: "颠覆式创新：好公司为什么仍会失败",
    professor: "Clayton Christensen",
    school: "Harvard Business School",
    level: "MBA 深度",
    access: "paid",
    priceYuan: 99,
    duration: "约 90 分钟",
    question: "当你持续服务好客户时，为什么反而可能走向失败？",
    description:
      "理解低端进入、价值网络与组织能力，识别被主流指标遮住的变化。",
  },
];

export function getNode(slug: string) {
  return nodes.find((node) => node.slug === slug);
}

export function gradePointForScore(score: number) {
  if (score >= 90) return 4;
  if (score >= 85) return 3.7;
  if (score >= 82) return 3.3;
  if (score >= 78) return 3;
  if (score >= 75) return 2.7;
  if (score >= 72) return 2.3;
  if (score >= 68) return 2;
  if (score >= 64) return 1.5;
  if (score >= 60) return 1;
  return 0;
}

export function weightedGpa(
  records: Array<{ credits: number; gradePoint: number }>,
) {
  const credits = records.reduce((sum, record) => sum + record.credits, 0);
  if (!credits) return 0;
  const points = records.reduce(
    (sum, record) => sum + record.credits * record.gradePoint,
    0,
  );
  return Math.round((points / credits) * 100) / 100;
}

export const membershipLevels = [
  { name: "新知", thresholdFen: 0, description: "开始建立第一张认知地图" },
  { name: "研习", thresholdFen: 30_000, description: "完成课程消费满 ¥300" },
  { name: "知行", thresholdFen: 50_000, description: "完成课程消费满 ¥500" },
  { name: "博雅", thresholdFen: 100_000, description: "完成课程消费满 ¥1,000" },
  { name: "格物", thresholdFen: 200_000, description: "完成课程消费满 ¥2,000" },
  { name: "问道", thresholdFen: 500_000, description: "完成课程消费满 ¥5,000" },
  { name: "山长", thresholdFen: 1_000_000, description: "完成课程消费满 ¥10,000" },
] as const;

export function membershipForCompletedSpend(completedSpendFen: number) {
  return [...membershipLevels]
    .reverse()
    .find((level) => completedSpendFen >= level.thresholdFen)!;
}

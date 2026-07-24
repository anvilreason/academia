import type { UniversityCourse } from "@/lib/content/university";

export type ContentStatus =
  | "formally-open"
  | "study-path"
  | "knowledge-node"
  | "co-building";

export const contentStatusLabels: Record<ContentStatus, string> = {
  "formally-open": "正式开放",
  "study-path": "研修路径",
  "knowledge-node": "知识节点",
  "co-building": "共建中",
};

export function courseContentStatus(
  course: Pick<UniversityCourse, "availability">,
): ContentStatus {
  return course.availability === "open" ? "formally-open" : "study-path";
}

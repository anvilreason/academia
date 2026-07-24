import { apiData } from "@/lib/server/api";
import { nodes } from "@/lib/content/nodes";

export async function GET() {
  return apiData(
    nodes.map((node) => ({
      slug: node.slug,
      title: node.title,
      school: node.school,
      level: node.level,
      priceYuan: node.priceYuan,
      status: node.slug === "4p-stp" ? "available" : "locked",
    })),
  );
}

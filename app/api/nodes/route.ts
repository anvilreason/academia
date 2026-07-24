import { apiData } from "@/lib/server/api";
import { nodes } from "@/lib/content/nodes";
import { getActor } from "@/lib/server/actor";
import { getRepository } from "@/lib/repositories";

export async function GET(request: Request) {
  const actor = await getActor(request);
  const repository = getRepository();
  return apiData(
    await Promise.all(
      nodes.map(async (node) => ({
        slug: node.slug,
        title: node.title,
        school: node.school,
        level: node.level,
        priceYuan: node.priceYuan,
        status:
          node.slug === "4p-stp" ||
          (actor.userId &&
            (await repository.hasEntitlement(actor.userId, node.slug)))
            ? "available"
            : "locked",
      })),
    ),
  );
}

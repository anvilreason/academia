import { notFound } from "next/navigation";
import { AgentWorkspace } from "@/components/features/learning/AgentWorkspace";
import { ProductShell } from "@/components/shared/ProductShell";
import { getNode } from "@/lib/content/nodes";

export default async function LearnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const node = getNode(slug);
  if (!node || slug === "disruptive-innovation") notFound();

  return (
    <ProductShell
      active="learn"
      context={node.access === "free" ? "免费试听" : "已解锁课程"}
      title={node.title.split("：")[0]}
    >
      <AgentWorkspace
        nodeSlug={node.slug}
        professor={node.professor}
        school={node.school}
        title={node.title}
      />
    </ProductShell>
  );
}

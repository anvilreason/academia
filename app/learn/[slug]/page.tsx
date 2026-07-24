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
  if (!node || slug !== "4p-stp") notFound();

  return (
    <ProductShell
      active="learn"
      context="试听 · 0%"
      title="4P 与 STP"
    >
      <AgentWorkspace />
    </ProductShell>
  );
}

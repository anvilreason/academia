import { GeneralAgentWorkspace } from "@/components/features/agent/GeneralAgentWorkspace";
import { ProductShell } from "@/components/shared/ProductShell";

export default function AgentPage() {
  return (
    <ProductShell active="agent" context="跨课程长期记忆" title="Academia Agent">
      <GeneralAgentWorkspace />
    </ProductShell>
  );
}

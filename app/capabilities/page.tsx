import { CapabilityProfile } from "@/components/features/capabilities/CapabilityProfile";
import { ProductShell } from "@/components/shared/ProductShell";

export default function CapabilitiesPage() {
  return (
    <ProductShell context="作品、证据与现实结果" title="能力档案">
      <CapabilityProfile />
    </ProductShell>
  );
}

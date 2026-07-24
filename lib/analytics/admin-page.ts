import { redirect } from "next/navigation";
import {
  canAccessAdminSection,
  getAdminAccess,
  type AdminSection,
} from "@/lib/analytics/admin";

export async function loadAdminSection(section: AdminSection) {
  const access = await getAdminAccess({
    action: `${section}.view`,
    resourceType: `admin_${section}`,
  });
  if (access.status === "signed_out") {
    redirect(
      `/login?continue=${encodeURIComponent(
        section === "overview" ? "/admin" : `/admin/${section}`,
      )}`,
    );
  }
  if (access.status !== "allowed") return { access, allowed: false as const };
  return {
    access,
    allowed: canAccessAdminSection(access.role, section),
  };
}

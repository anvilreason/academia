import { and, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { getToken } from "next-auth/jwt";
import { getDb } from "@/db";
import { adminAuditLogs, adminMembers } from "@/db/schema";
import { newId, nowIso } from "@/lib/server/api";
import { runtimeEnv } from "@/lib/server/env";
import {
  isAdminRole,
  type AdminRole,
} from "@/lib/analytics/admin-permissions";

export {
  ADMIN_ROLES,
  adminRoleLabel,
  canAccessAdminSection,
  isAdminRole,
} from "@/lib/analytics/admin-permissions";
export type {
  AdminRole,
  AdminSection,
} from "@/lib/analytics/admin-permissions";

export type AdminAccess =
  | { status: "signed_out" }
  | { status: "forbidden"; email: string }
  | {
      status: "allowed";
      userId: string;
      email: string;
      name: string | null;
      role: AdminRole;
    };

type AccessOptions = {
  action?: string;
  resourceType?: string;
  resourceId?: string;
  audit?: boolean;
};

function ownerEmails() {
  return new Set(
    (runtimeEnv().ADMIN_OWNER_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isOwnerEmail(email: string) {
  return ownerEmails().has(email.trim().toLowerCase());
}

export async function auditAdminAction(input: {
  email: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  const now = nowIso();
  await getDb().insert(adminAuditLogs).values({
    id: newId(),
    adminEmail: input.email,
    action: input.action,
    resourceType: input.resourceType ?? null,
    resourceId: input.resourceId ?? null,
    metadataJson: JSON.stringify(input.metadata ?? {}),
    createdAt: now,
    updatedAt: now,
  });
}

async function accessFromRequest(
  request: Request,
  options: AccessOptions = {},
): Promise<AdminAccess> {
  const token = await getToken({
    req: request,
    secret: runtimeEnv().AUTH_SECRET,
    secureCookie: new URL(request.url).protocol === "https:",
  });
  const email =
    typeof token?.email === "string"
      ? token.email.trim().toLowerCase()
      : null;
  if (!token?.sub || !email) return { status: "signed_out" };

  const now = nowIso();
  const owner = isOwnerEmail(email);
  const [existing] = await getDb()
    .select()
    .from(adminMembers)
    .where(
      and(
        eq(adminMembers.email, email),
        eq(adminMembers.status, "active"),
        isNull(adminMembers.deletedAt),
      ),
    )
    .limit(1);
  if (!owner && !existing) return { status: "forbidden", email };

  const role: AdminRole = owner
    ? "owner"
    : isAdminRole(existing?.role ?? "")
      ? (existing?.role as AdminRole)
      : "viewer";
  const [member] = await getDb()
    .insert(adminMembers)
    .values({
      id: existing?.id ?? newId(),
      userId: token.sub,
      email,
      role,
      status: "active",
      lastAccessAt: now,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: adminMembers.email,
      set: {
        userId: token.sub,
        role,
        status: "active",
        lastAccessAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    })
    .returning();
  if (options.audit !== false) {
    await auditAdminAction({
      email,
      action: options.action ?? "dashboard.view",
      resourceType: options.resourceType ?? "admin_dashboard",
      resourceId: options.resourceId,
      metadata: { role: member.role },
    });
  }
  return {
    status: "allowed",
    userId: token.sub,
    email,
    name: typeof token.name === "string" ? token.name : null,
    role,
  };
}

export async function getAdminAccess(options: AccessOptions = {}) {
  const requestHeaders = await headers();
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (requestHeaders.get("host")?.startsWith("localhost") ? "http" : "https");
  const request = new Request(
    `${protocol}://${requestHeaders.get("host") ?? "academia.local"}/admin`,
    { headers: requestHeaders },
  );
  return accessFromRequest(request, options);
}

export function getAdminAccessFromRequest(
  request: Request,
  options: AccessOptions = {},
) {
  return accessFromRequest(request, options);
}

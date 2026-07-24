import { and, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { getToken } from "next-auth/jwt";
import { getDb } from "@/db";
import { adminAuditLogs, adminMembers } from "@/db/schema";
import { newId, nowIso } from "@/lib/server/api";
import { runtimeEnv } from "@/lib/server/env";

export type AdminAccess =
  | { status: "signed_out" }
  | { status: "forbidden"; email: string }
  | {
      status: "allowed";
      email: string;
      name: string | null;
      role: string;
    };

function ownerEmails() {
  return new Set(
    (runtimeEnv().ADMIN_OWNER_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function getAdminAccess(): Promise<AdminAccess> {
  const requestHeaders = await headers();
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (requestHeaders.get("host")?.startsWith("localhost") ? "http" : "https");
  const request = new Request(
    `${protocol}://${requestHeaders.get("host") ?? "academia.local"}/admin`,
    { headers: requestHeaders },
  );
  const token = await getToken({
    req: request,
    secret: runtimeEnv().AUTH_SECRET,
    secureCookie: protocol === "https",
  });
  const email =
    typeof token?.email === "string"
      ? token.email.trim().toLowerCase()
      : null;
  if (!token?.sub || !email) return { status: "signed_out" };
  const now = nowIso();
  const owner = ownerEmails().has(email);
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
  const role = owner ? "owner" : existing?.role ?? "viewer";
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
  await getDb().insert(adminAuditLogs).values({
    id: newId(),
    adminEmail: email,
    action: "dashboard.view",
    resourceType: "admin_dashboard",
    metadataJson: JSON.stringify({ role: member.role }),
    createdAt: now,
    updatedAt: now,
  });
  return {
    status: "allowed",
    email,
    name: typeof token.name === "string" ? token.name : null,
    role: member.role,
  };
}

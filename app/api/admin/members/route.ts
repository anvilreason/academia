import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { adminMembers, users } from "@/db/schema";
import {
  ADMIN_ROLES,
  auditAdminAction,
  getAdminAccessFromRequest,
  isAdminRole,
  isOwnerEmail,
} from "@/lib/analytics/admin";
import { apiData, apiError, newId, nowIso } from "@/lib/server/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireOwner(request: Request, action: string) {
  const access = await getAdminAccessFromRequest(request, {
    action,
    resourceType: "admin_member",
  });
  return access.status === "allowed" && access.role === "owner"
    ? access
    : null;
}

export async function GET(request: Request) {
  const access = await requireOwner(request, "team.list");
  if (!access) return apiError("FORBIDDEN", "仅所有者可管理团队", 403);
  const members = await getDb()
    .select()
    .from(adminMembers)
    .where(isNull(adminMembers.deletedAt))
    .orderBy(desc(adminMembers.createdAt));
  return apiData({ members, roles: ADMIN_ROLES });
}

export async function POST(request: Request) {
  const access = await requireOwner(request, "team.add_attempt");
  if (!access) return apiError("FORBIDDEN", "仅所有者可添加成员", 403);
  const body = (await request.json()) as { email?: string; role?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const role = body.role?.trim() ?? "";
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return apiError("BAD_REQUEST", "请输入有效邮箱", 400);
  }
  if (!isAdminRole(role) || role === "owner") {
    return apiError("BAD_REQUEST", "请选择有效团队角色", 400);
  }
  if (isOwnerEmail(email)) {
    return apiError("CONFLICT", "该账户已经是所有者", 409);
  }
  const [user] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);
  const now = nowIso();
  const [member] = await getDb()
    .insert(adminMembers)
    .values({
      id: newId(),
      userId: user?.id ?? null,
      email,
      role,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: adminMembers.email,
      set: {
        userId: user?.id ?? null,
        role,
        status: "active",
        updatedAt: now,
        deletedAt: null,
      },
    })
    .returning();
  await auditAdminAction({
    email: access.email,
    action: "team.add",
    resourceType: "admin_member",
    resourceId: member.id,
    metadata: { memberEmail: email, role },
  });
  return apiData(member, { status: 201 });
}

export async function PATCH(request: Request) {
  const access = await requireOwner(request, "team.update_attempt");
  if (!access) return apiError("FORBIDDEN", "仅所有者可调整权限", 403);
  const body = (await request.json()) as {
    id?: string;
    role?: string;
    status?: string;
  };
  const id = body.id?.trim() ?? "";
  const role = body.role?.trim() ?? "";
  const status = body.status === "suspended" ? "suspended" : "active";
  if (!id || !isAdminRole(role) || role === "owner") {
    return apiError("BAD_REQUEST", "成员或角色无效", 400);
  }
  const [existing] = await getDb()
    .select()
    .from(adminMembers)
    .where(eq(adminMembers.id, id))
    .limit(1);
  if (!existing) return apiError("NOT_FOUND", "团队成员不存在", 404);
  if (isOwnerEmail(existing.email)) {
    return apiError("FORBIDDEN", "所有者权限由部署环境控制", 403);
  }
  const [member] = await getDb()
    .update(adminMembers)
    .set({ role, status, updatedAt: nowIso() })
    .where(eq(adminMembers.id, id))
    .returning();
  await auditAdminAction({
    email: access.email,
    action: "team.update",
    resourceType: "admin_member",
    resourceId: id,
    metadata: { memberEmail: member.email, role, status },
  });
  return apiData(member);
}

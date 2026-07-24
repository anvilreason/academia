import { desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { trackingLinks } from "@/db/schema";
import {
  auditAdminAction,
  canAccessAdminSection,
  getAdminAccessFromRequest,
} from "@/lib/analytics/admin";
import { isSafeTrackingTarget } from "@/lib/analytics/attribution";
import { apiData, apiError, newId, nowIso } from "@/lib/server/api";

const WRITERS = new Set(["owner", "admin", "growth"]);

function clean(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function linkCode(name: string) {
  const slug = name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28);
  return `${slug || "academia"}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function GET(request: Request) {
  const access = await getAdminAccessFromRequest(request, {
    action: "tracking.list",
    resourceType: "tracking_link",
  });
  if (access.status !== "allowed") {
    return apiError("FORBIDDEN", "无权访问渠道链接", 403);
  }
  if (!canAccessAdminSection(access.role, "tracking")) {
    return apiError("FORBIDDEN", "当前角色无渠道权限", 403);
  }
  const links = await getDb()
    .select()
    .from(trackingLinks)
    .where(isNull(trackingLinks.deletedAt))
    .orderBy(desc(trackingLinks.createdAt));
  return apiData(links);
}

export async function POST(request: Request) {
  const access = await getAdminAccessFromRequest(request, {
    action: "tracking.create_attempt",
    resourceType: "tracking_link",
  });
  if (access.status !== "allowed" || !WRITERS.has(access.role)) {
    return apiError("FORBIDDEN", "当前角色不能创建渠道链接", 403);
  }
  const body = (await request.json()) as Record<string, unknown>;
  const name = clean(body.name, 80);
  const targetPath = clean(body.targetPath, 300);
  const source = clean(body.source, 100);
  const medium = clean(body.medium, 100);
  const campaign = clean(body.campaign, 120);
  if (!name || !source || !medium || !campaign) {
    return apiError("BAD_REQUEST", "请完整填写链接名称和渠道信息", 400);
  }
  if (!isSafeTrackingTarget(targetPath)) {
    return apiError("BAD_REQUEST", "目标必须是站内安全路径", 400);
  }
  const now = nowIso();
  const [link] = await getDb()
    .insert(trackingLinks)
    .values({
      id: newId(),
      code: linkCode(name),
      name,
      targetPath,
      source,
      medium,
      campaign,
      ownerEmail: access.email,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  await auditAdminAction({
    email: access.email,
    action: "tracking.create",
    resourceType: "tracking_link",
    resourceId: link.id,
    metadata: { code: link.code, campaign: link.campaign },
  });
  return apiData(link, { status: 201 });
}

export async function PATCH(request: Request) {
  const access = await getAdminAccessFromRequest(request, {
    action: "tracking.update_attempt",
    resourceType: "tracking_link",
  });
  if (access.status !== "allowed" || !WRITERS.has(access.role)) {
    return apiError("FORBIDDEN", "当前角色不能修改渠道链接", 403);
  }
  const body = (await request.json()) as {
    id?: string;
    status?: string;
  };
  const id = clean(body.id, 80);
  const status = body.status === "active" ? "active" : "paused";
  if (!id) return apiError("BAD_REQUEST", "缺少链接标识", 400);
  const now = nowIso();
  const [link] = await getDb()
    .update(trackingLinks)
    .set({ status, updatedAt: now })
    .where(eq(trackingLinks.id, id))
    .returning();
  if (!link) return apiError("NOT_FOUND", "渠道链接不存在", 404);
  await auditAdminAction({
    email: access.email,
    action: "tracking.status",
    resourceType: "tracking_link",
    resourceId: id,
    metadata: { status },
  });
  return apiData(link);
}

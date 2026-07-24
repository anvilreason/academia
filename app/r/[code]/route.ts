import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { trackingLinks } from "@/db/schema";
import {
  isSafeTrackingTarget,
  serializeAttributionCookie,
} from "@/lib/analytics/attribution";
import { recordAnalyticsEventSafe } from "@/lib/analytics/events";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const [link] = await getDb()
    .select()
    .from(trackingLinks)
    .where(
      and(
        eq(trackingLinks.code, code.slice(0, 80)),
        eq(trackingLinks.status, "active"),
        isNull(trackingLinks.deletedAt),
      ),
    )
    .limit(1);
  if (!link || !isSafeTrackingTarget(link.targetPath)) {
    return Response.redirect(new URL("/", request.url), 302);
  }
  const attribution = {
    trackingLinkId: link.id,
    source: link.source,
    medium: link.medium,
    campaign: link.campaign,
  };
  await recordAnalyticsEventSafe({
    eventName: "tracking_link_clicked",
    request,
    path: link.targetPath,
    attribution,
    properties: { code: link.code },
  });
  return new Response(null, {
    status: 302,
    headers: {
      location: new URL(link.targetPath, request.url).toString(),
      "set-cookie": serializeAttributionCookie(
        attribution,
        new URL(request.url).protocol === "https:",
      ),
      "cache-control": "no-store",
    },
  });
}

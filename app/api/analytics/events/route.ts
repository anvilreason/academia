import {
  CLIENT_ANALYTICS_EVENTS,
  recordAnalyticsEvent,
  type AnalyticsEventName,
} from "@/lib/analytics/events";
import { apiData, apiError } from "@/lib/server/api";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      eventId?: string;
      eventName?: string;
      analyticsSessionId?: string;
      path?: string;
      referrer?: string | null;
      engagementMs?: number;
      properties?: Record<
        string,
        string | number | boolean | null | undefined
      >;
    };
    if (
      !body.eventName ||
      !CLIENT_ANALYTICS_EVENTS.has(body.eventName) ||
      !body.eventId ||
      !body.path?.startsWith("/") ||
      body.path.length > 500
    ) {
      return apiError("BAD_REQUEST", "无效的分析事件", 400);
    }
    await recordAnalyticsEvent({
      eventId: body.eventId,
      eventName: body.eventName as AnalyticsEventName,
      request,
      analyticsSessionId: body.analyticsSessionId,
      path: body.path,
      referrer: body.referrer,
      engagementMs: body.engagementMs,
      properties: body.properties,
    });
    return apiData({ accepted: true }, { status: 202 });
  } catch (error) {
    console.error("analytics_event_failed", error);
    return apiError("INTERNAL_ERROR", "分析事件暂时无法记录", 500);
  }
}

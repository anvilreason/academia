"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type AnalyticsSignalProps = {
  eventName:
    | "answer_map_viewed"
    | "answer_path_viewed"
    | "knowledge_node_opened"
    | "artifact_share_viewed";
  properties: Record<string, string | number | boolean>;
};

function analyticsSessionId() {
  const key = "academia_analytics_session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.sessionStorage.setItem(key, id);
  return id;
}

export function AnalyticsSignal({
  eventName,
  properties,
}: AnalyticsSignalProps) {
  const pathname = usePathname();
  const serializedProperties = JSON.stringify(properties);

  useEffect(() => {
    if (!pathname) return;
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventId: crypto.randomUUID(),
        eventName,
        analyticsSessionId: analyticsSessionId(),
        path: pathname,
        referrer: document.referrer || null,
        properties: JSON.parse(serializedProperties),
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [eventName, pathname, serializedProperties]);

  return null;
}

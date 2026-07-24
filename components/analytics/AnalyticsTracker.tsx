"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function analyticsSessionId() {
  const key = "academia_analytics_session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.sessionStorage.setItem(key, id);
  return id;
}

function emit(
  eventName: "page_view" | "page_engaged",
  pathname: string,
  engagementMs?: number,
) {
  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      eventId: crypto.randomUUID(),
      eventName,
      analyticsSessionId: analyticsSessionId(),
      path: pathname,
      referrer: document.referrer || null,
      engagementMs,
    }),
    keepalive: true,
  }).catch(() => undefined);
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    emit("page_view", pathname);
    const startedAt = Date.now();
    const timer = window.setTimeout(() => {
      emit("page_engaged", pathname, Date.now() - startedAt);
    }, 30_000);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}

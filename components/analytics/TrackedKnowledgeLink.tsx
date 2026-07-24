"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText } from "lucide-react";

export function TrackedKnowledgeLink({
  contentVersion,
  evaluationVersion,
  href,
  label,
  pathSlug,
  pathVersion,
  reason,
  targetType,
}: {
  contentVersion: string;
  evaluationVersion: string;
  href: string;
  label: string;
  pathSlug: string;
  pathVersion: string;
  reason: string;
  targetType: "课程与学院" | "学院与专业";
}) {
  function track() {
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventId: crypto.randomUUID(),
        eventName: "knowledge_node_opened",
        path: window.location.pathname,
        properties: {
          answerPathSlug: pathSlug,
          pathVersion,
          contentVersion,
          evaluationVersion,
          targetHref: href,
        },
      }),
      keepalive: true,
    }).catch(() => undefined);
  }
  return (
    <Link href={href} onClick={track}>
      <BookOpenText aria-hidden="true" />
      <span>{targetType}</span>
      <strong>{label}</strong>
      <p>{reason}</p>
      <ArrowRight aria-hidden="true" size={16} />
    </Link>
  );
}

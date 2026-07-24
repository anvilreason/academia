export const ATTRIBUTION_COOKIE = "academia_attribution";

export type Attribution = {
  trackingLinkId: string;
  source: string;
  medium: string;
  campaign: string;
};

function clean(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, max) : null;
}

export function parseCookieHeader(cookieHeader: string | null) {
  const cookies = new Map<string, string>();
  for (const item of cookieHeader?.split(";") ?? []) {
    const separator = item.indexOf("=");
    if (separator < 1) continue;
    cookies.set(
      item.slice(0, separator).trim(),
      item.slice(separator + 1).trim(),
    );
  }
  return cookies;
}

export function parseAttributionCookie(cookieHeader: string | null) {
  const raw = parseCookieHeader(cookieHeader).get(ATTRIBUTION_COOKIE);
  if (!raw) return null;
  try {
    const value = JSON.parse(decodeURIComponent(raw)) as Record<
      string,
      unknown
    >;
    const trackingLinkId = clean(value.trackingLinkId, 80);
    const source = clean(value.source, 100);
    const medium = clean(value.medium, 100);
    const campaign = clean(value.campaign, 120);
    if (!trackingLinkId || !source || !medium || !campaign) return null;
    return { trackingLinkId, source, medium, campaign } satisfies Attribution;
  } catch {
    return null;
  }
}

export function serializeAttributionCookie(
  attribution: Attribution,
  secure = true,
) {
  const value = encodeURIComponent(JSON.stringify(attribution));
  return `${ATTRIBUTION_COOKIE}=${value}; Path=/; Max-Age=7776000; HttpOnly; ${
    secure ? "Secure; " : ""
  }SameSite=Lax`;
}

export function isSafeTrackingTarget(path: string) {
  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.startsWith("/r/") &&
    path.length <= 300
  );
}

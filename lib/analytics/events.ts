import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import {
  analyticsEvents,
  analyticsIdentityLinks,
  users,
} from "@/db/schema";
import {
  getUniversityCourse,
  getUniversityProgram,
  getUniversitySchool,
} from "@/lib/content/university";
import { ensureGuestId, getActor } from "@/lib/server/actor";
import {
  newId,
  nowIso,
  shanghaiDateKey,
} from "@/lib/server/api";
import {
  parseAttributionCookie,
  type Attribution,
} from "@/lib/analytics/attribution";

export const CLIENT_ANALYTICS_EVENTS = new Set([
  "page_view",
  "page_engaged",
]);

export type AnalyticsEventName =
  | "page_view"
  | "page_engaged"
  | "tracking_link_clicked"
  | "signup_completed"
  | "login_succeeded"
  | "trial_started"
  | "program_enrolled"
  | "course_enrolled"
  | "course_started"
  | "learning_message_sent"
  | "exam_submitted"
  | "course_completed"
  | "agent_message_sent"
  | "order_created"
  | "payment_succeeded";

type EventProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

type IncomingCf = {
  country?: string | null;
  region?: string | null;
  city?: string | null;
  timezone?: string | null;
};

type RecordEventInput = {
  eventId?: string;
  eventName: AnalyticsEventName;
  request?: Request;
  userId?: string | null;
  guestId?: string | null;
  analyticsSessionId?: string | null;
  path?: string | null;
  referrer?: string | null;
  engagementMs?: number | null;
  properties?: EventProperties;
  attribution?: Attribution | null;
  occurredAt?: Date;
  isTest?: boolean;
};

function cleanSegment(value: string | null | undefined, max = 160) {
  const clean = value?.trim();
  return clean ? clean.slice(0, max) : null;
}

function safeProperties(properties: EventProperties = {}) {
  const entries = Object.entries(properties)
    .filter(([, value]) =>
      ["string", "number", "boolean"].includes(typeof value),
    )
    .slice(0, 20)
    .map(([key, value]) => [
      key.slice(0, 60),
      typeof value === "string" ? value.slice(0, 240) : value,
    ]);
  return JSON.stringify(Object.fromEntries(entries)).slice(0, 4_000);
}

function pathContext(path: string | null) {
  if (!path) {
    return {
      schoolSlug: null,
      programSlug: null,
      courseSlug: null,
    };
  }
  const parts = path.split("/").filter(Boolean);
  let schoolSlug: string | null = null;
  let programSlug: string | null = null;
  let courseSlug: string | null = null;
  if (parts[0] === "college" && parts[1]) {
    schoolSlug = getUniversitySchool(parts[1])?.slug ?? null;
  } else if (parts[0] === "programs" && parts[1]) {
    const program = getUniversityProgram(parts[1]);
    schoolSlug = program?.schoolSlug ?? null;
    programSlug = program?.slug ?? null;
  } else if (
    (parts[0] === "courses" || parts[0] === "learn") &&
    parts[1]
  ) {
    const academic = getUniversityCourse(parts[1]);
    schoolSlug = academic?.school.slug ?? null;
    programSlug = academic?.program.slug ?? null;
    courseSlug = academic?.course.slug ?? parts[1].slice(0, 120);
  }
  return { schoolSlug, programSlug, courseSlug };
}

function referrerHost(referrer: string | null | undefined) {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.slice(0, 180);
  } catch {
    return null;
  }
}

function deviceCategory(request?: Request) {
  const agent = request?.headers.get("user-agent")?.toLowerCase() ?? "";
  if (!agent) return null;
  if (/ipad|tablet|playbook/.test(agent)) return "tablet";
  if (/mobile|iphone|android/.test(agent)) return "mobile";
  return "desktop";
}

function geo(request?: Request) {
  const cf = (
    request as (Request & { cf?: IncomingCf }) | undefined
  )?.cf;
  return {
    country:
      cleanSegment(cf?.country, 8) ??
      cleanSegment(request?.headers.get("cf-ipcountry"), 8),
    region: cleanSegment(cf?.region, 100),
    city: cleanSegment(cf?.city, 100),
    timezone: cleanSegment(cf?.timezone, 80),
  };
}

async function isTestUser(userId: string | null, explicit?: boolean) {
  if (explicit !== undefined) return explicit;
  if (!userId) return false;
  const [user] = await getDb()
    .select({ email: users.email })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);
  return Boolean(
    user?.email.endsWith("@example.com") ||
      user?.email.includes("+test@"),
  );
}

export async function recordAnalyticsEvent(input: RecordEventInput) {
  const requestActor = input.request
    ? await getActor(input.request)
    : { userId: null, guestId: null };
  const userId = input.userId ?? requestActor.userId ?? null;
  let guestId = input.guestId ?? requestActor.guestId ?? null;
  if (!userId && !guestId && input.request) {
    guestId = await ensureGuestId();
  }
  const occurred = input.occurredAt ?? new Date();
  const occurredAt = occurred.toISOString();
  const now = nowIso();
  const path = cleanSegment(input.path, 500);
  const context = pathContext(path);
  const location = geo(input.request);
  const attribution =
    input.attribution ??
    parseAttributionCookie(
      input.request?.headers.get("cookie") ?? null,
    );
  const propertyProgramSlug =
    typeof input.properties?.programSlug === "string"
      ? input.properties.programSlug
      : null;
  const propertyCourseSlug =
    typeof input.properties?.courseSlug === "string"
      ? input.properties.courseSlug
      : null;
  await getDb()
    .insert(analyticsEvents)
    .values({
      id: cleanSegment(input.eventId, 80) ?? newId(),
      eventName: input.eventName,
      schemaVersion: 1,
      dateKey: shanghaiDateKey(occurred),
      userId,
      guestId,
      analyticsSessionId: cleanSegment(
        input.analyticsSessionId,
        100,
      ),
      path,
      referrerHost: referrerHost(input.referrer),
      schoolSlug: context.schoolSlug,
      programSlug:
        cleanSegment(propertyProgramSlug, 120) ??
        context.programSlug,
      courseSlug:
        cleanSegment(propertyCourseSlug, 120) ??
        context.courseSlug,
      trackingLinkId: attribution?.trackingLinkId ?? null,
      acquisitionSource: attribution?.source ?? null,
      acquisitionMedium: attribution?.medium ?? null,
      acquisitionCampaign: attribution?.campaign ?? null,
      country: location.country,
      region: location.region,
      city: location.city,
      timezone: location.timezone,
      deviceCategory: deviceCategory(input.request),
      engagementMs:
        typeof input.engagementMs === "number"
          ? Math.min(Math.max(Math.round(input.engagementMs), 0), 86_400_000)
          : null,
      propertiesJson: safeProperties(input.properties),
      isTest: await isTestUser(userId, input.isTest),
      occurredAt,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();
}

export async function recordAnalyticsEventSafe(input: RecordEventInput) {
  try {
    await recordAnalyticsEvent(input);
  } catch (error) {
    console.error("analytics_record_failed", {
      eventName: input.eventName,
      error,
    });
  }
}

export async function claimAnalyticsIdentity(
  guestId: string | null,
  userId: string,
) {
  if (!guestId) return;
  const now = nowIso();
  await getDb()
    .insert(analyticsIdentityLinks)
    .values({
      id: newId(),
      guestId,
      userId,
      linkedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();
  await getDb()
    .update(analyticsEvents)
    .set({ userId, updatedAt: now })
    .where(
      and(
        eq(analyticsEvents.guestId, guestId),
        isNull(analyticsEvents.userId),
      ),
    );
}

export async function claimAnalyticsIdentitySafe(
  guestId: string | null,
  userId: string,
) {
  try {
    await claimAnalyticsIdentity(guestId, userId);
  } catch (error) {
    console.error("analytics_identity_claim_failed", error);
  }
}

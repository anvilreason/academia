import { and, desc, gte, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import {
  analyticsEvents,
  analyticsIdentityLinks,
  examAttempts,
  learningSessions,
  llmCallLogs,
  orders,
  userPrograms,
  users,
} from "@/db/schema";
import {
  getUniversityProgram,
  getUniversitySchool,
} from "@/lib/content/university";
import { shanghaiDateKey } from "@/lib/server/api";
import {
  ACTIVE_EVENT_NAMES,
  LEARNING_EVENT_NAMES,
} from "@/lib/analytics/metric-definitions";

const DAY = 86_400_000;

function isTestEmail(email: string) {
  return email.endsWith("@example.com") || email.includes("+test@");
}

function actorKey(input: {
  userId?: string | null;
  guestId?: string | null;
}) {
  if (input.userId) return `u:${input.userId}`;
  if (input.guestId) return `g:${input.guestId}`;
  return null;
}

function maxIso(...values: Array<string | null | undefined>) {
  return values.filter(Boolean).sort().at(-1) ?? null;
}

function lastDateKeys(count: number) {
  return Array.from({ length: count }, (_, index) =>
    shanghaiDateKey(new Date(Date.now() - (count - index - 1) * DAY)),
  );
}

export type AdminSummary = Awaited<ReturnType<typeof getAdminSummary>>;

export async function getAdminSummary() {
  const now = new Date();
  const today = shanghaiDateKey(now);
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY).toISOString();
  const [
    userRows,
    sessionRows,
    eventRows,
    programRows,
    llmRows,
    orderRows,
    attemptRows,
    identityRows,
  ] = await Promise.all([
    getDb()
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        status: users.status,
        emailVerifiedAt: users.emailVerifiedAt,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(isNull(users.deletedAt))
      .orderBy(desc(users.createdAt)),
    getDb()
      .select({
        id: learningSessions.id,
        userId: learningSessions.userId,
        guestId: learningSessions.guestId,
        nodeSlug: learningSessions.nodeSlug,
        status: learningSessions.status,
        progress: learningSessions.progress,
        createdAt: learningSessions.createdAt,
        updatedAt: learningSessions.updatedAt,
      })
      .from(learningSessions)
      .where(isNull(learningSessions.deletedAt)),
    getDb()
      .select({
        eventName: analyticsEvents.eventName,
        dateKey: analyticsEvents.dateKey,
        userId: analyticsEvents.userId,
        guestId: analyticsEvents.guestId,
        path: analyticsEvents.path,
        city: analyticsEvents.city,
        region: analyticsEvents.region,
        country: analyticsEvents.country,
        occurredAt: analyticsEvents.occurredAt,
        isTest: analyticsEvents.isTest,
      })
      .from(analyticsEvents)
      .where(
        and(
          gte(analyticsEvents.occurredAt, thirtyDaysAgo),
          isNull(analyticsEvents.deletedAt),
        ),
      ),
    getDb()
      .select({
        userId: userPrograms.userId,
        programSlug: userPrograms.programSlug,
        createdAt: userPrograms.createdAt,
      })
      .from(userPrograms)
      .where(isNull(userPrograms.deletedAt)),
    getDb()
      .select({
        userId: llmCallLogs.userId,
        actualFen: llmCallLogs.actualFen,
        createdAt: llmCallLogs.createdAt,
      })
      .from(llmCallLogs)
      .where(
        and(
          gte(llmCallLogs.createdAt, thirtyDaysAgo),
          isNull(llmCallLogs.deletedAt),
        ),
      ),
    getDb()
      .select({
        userId: orders.userId,
        status: orders.status,
        paymentMode: orders.paymentMode,
        amountFen: orders.amountFen,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, thirtyDaysAgo),
          isNull(orders.deletedAt),
        ),
      ),
    getDb()
      .select({
        userId: examAttempts.userId,
        nodeSlug: examAttempts.nodeSlug,
        passed: examAttempts.passed,
        creditsEarned: examAttempts.creditsEarned,
        createdAt: examAttempts.createdAt,
      })
      .from(examAttempts)
      .where(isNull(examAttempts.deletedAt)),
    getDb()
      .select({
        guestId: analyticsIdentityLinks.guestId,
        userId: analyticsIdentityLinks.userId,
      })
      .from(analyticsIdentityLinks)
      .where(isNull(analyticsIdentityLinks.deletedAt)),
  ]);

  const realUsers = userRows.filter((user) => !isTestEmail(user.email));
  const testUserIds = new Set(
    userRows.filter((user) => isTestEmail(user.email)).map((user) => user.id),
  );
  const identityByGuest = new Map(
    identityRows.map((row) => [row.guestId, row.userId]),
  );
  const realEvents = eventRows
    .map((event) => ({
      ...event,
      userId:
        event.userId ??
        (event.guestId
          ? identityByGuest.get(event.guestId) ?? null
          : null),
    }))
    .filter(
      (event) =>
        !event.isTest &&
        (!event.userId || !testUserIds.has(event.userId)),
    );
  const realSessions = sessionRows.filter(
    (session) => !session.userId || !testUserIds.has(session.userId),
  );
  const realAttempts = attemptRows.filter(
    (attempt) => !testUserIds.has(attempt.userId),
  );
  const events7d = realEvents.filter(
    (event) => event.occurredAt >= sevenDaysAgo,
  );
  const meaningful7d = events7d.filter((event) =>
    ACTIVE_EVENT_NAMES.has(event.eventName),
  );
  const active7d = new Set(
    meaningful7d.map(actorKey).filter((key): key is string => Boolean(key)),
  );
  const learningUsers7d = new Set(
    events7d
      .filter((event) => LEARNING_EVENT_NAMES.has(event.eventName))
      .map(actorKey)
      .filter((key): key is string => Boolean(key)),
  );

  const dateKeys = lastDateKeys(14);
  const trend = dateKeys.map((dateKey) => {
    const registrations = realUsers.filter(
      (user) => shanghaiDateKey(new Date(user.createdAt)) === dateKey,
    ).length;
    const active = new Set(
      realEvents
        .filter(
          (event) =>
            event.dateKey === dateKey &&
            ACTIVE_EVENT_NAMES.has(event.eventName),
        )
        .map(actorKey)
        .filter((key): key is string => Boolean(key)),
    ).size;
    return { dateKey, registrations, active };
  });

  const pageCounts = new Map<string, number>();
  for (const event of realEvents.filter(
    (row) => row.eventName === "page_view",
  )) {
    if (event.eventName !== "page_view" || !event.path) continue;
    pageCounts.set(event.path, (pageCounts.get(event.path) ?? 0) + 1);
  }
  const topPages = [...pageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([path, views]) => ({ path, views }));

  const cityActors = new Map<
    string,
    { city: string; region: string | null; country: string | null; actors: Set<string> }
  >();
  for (const event of realEvents.filter(
    (row) => row.eventName === "page_view",
  )) {
    const key = actorKey(event);
    if (!key || !event.city) continue;
    const locationKey = `${event.country ?? ""}|${event.region ?? ""}|${event.city}`;
    const current = cityActors.get(locationKey) ?? {
      city: event.city,
      region: event.region,
      country: event.country,
      actors: new Set<string>(),
    };
    current.actors.add(key);
    cityActors.set(locationKey, current);
  }
  const topCities = [...cityActors.values()]
    .sort((a, b) => b.actors.size - a.actors.size)
    .slice(0, 6)
    .map(({ city, region, country, actors }) => ({
      city,
      region,
      country,
      users: actors.size,
    }));

  const programCounts = new Map<string, Set<string>>();
  for (const record of programRows) {
    if (testUserIds.has(record.userId)) continue;
    const set = programCounts.get(record.programSlug) ?? new Set<string>();
    set.add(record.userId);
    programCounts.set(record.programSlug, set);
  }
  const topPrograms = [...programCounts.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 6)
    .map(([programSlug, people]) => {
      const program = getUniversityProgram(programSlug);
      const school = program
        ? getUniversitySchool(program.schoolSlug)
        : null;
      return {
        programSlug,
        name: program?.name ?? programSlug,
        school: school?.name ?? "未归类学院",
        students: people.size,
      };
    });

  const lastActivityByUser = new Map<string, string>();
  const cityByUser = new Map<string, string>();
  for (const event of realEvents) {
    if (!event.userId) continue;
    lastActivityByUser.set(
      event.userId,
      maxIso(lastActivityByUser.get(event.userId), event.occurredAt) ??
        event.occurredAt,
    );
    if (event.city) cityByUser.set(event.userId, event.city);
  }
  for (const session of realSessions) {
    if (!session.userId) continue;
    lastActivityByUser.set(
      session.userId,
      maxIso(lastActivityByUser.get(session.userId), session.updatedAt) ??
        session.updatedAt,
    );
  }
  const recentUsers = realUsers.slice(0, 8).map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    verified: Boolean(user.emailVerifiedAt),
    createdAt: user.createdAt,
    lastActiveAt: maxIso(
      user.lastLoginAt,
      lastActivityByUser.get(user.id),
    ),
    city: cityByUser.get(user.id) ?? null,
  }));

  const visitors30 = new Set(
    realEvents
      .filter((event) => event.eventName === "page_view")
      .map(actorKey)
      .filter((key): key is string => Boolean(key)),
  ).size;
  const trialActors = new Set(
    realEvents
      .filter((event) => event.eventName === "trial_started")
      .map(actorKey)
      .filter((key): key is string => Boolean(key)),
  );
  const registeredActors = new Set(
    realUsers
      .filter((user) => user.createdAt >= thirtyDaysAgo)
      .map((user) => `u:${user.id}`),
  );
  const learnerActors = new Set(
    realEvents
      .filter((event) => LEARNING_EVENT_NAMES.has(event.eventName))
      .map(actorKey)
      .filter((key): key is string => Boolean(key)),
  );
  const completedActors = new Set(
    realAttempts
      .filter(
        (attempt) =>
          attempt.passed && attempt.createdAt >= thirtyDaysAgo,
      )
      .map((attempt) => `u:${attempt.userId}`),
  );
  const paidActors = new Set(
    orderRows
      .filter(
        (order) =>
          order.status === "paid" &&
          order.paymentMode === "production" &&
          !testUserIds.has(order.userId),
      )
      .map((order) => `u:${order.userId}`),
  );
  const visitorActors = new Set(
    realEvents
      .filter((event) => event.eventName === "page_view")
      .map(actorKey)
      .filter((key): key is string => Boolean(key)),
  );
  const intersect = (left: Set<string>, right: Set<string>) =>
    new Set([...left].filter((key) => right.has(key)));
  const funnelTrial = intersect(visitorActors, trialActors);
  const funnelRegistered = intersect(funnelTrial, registeredActors);
  const funnelLearners = intersect(funnelRegistered, learnerActors);
  const funnelCompleted = intersect(funnelLearners, completedActors);
  const funnelPaid = intersect(funnelCompleted, paidActors);
  const completedCourseKeys = new Set(
    realAttempts
      .filter((attempt) => attempt.passed)
      .map((attempt) => `${attempt.userId}|${attempt.nodeSlug}`),
  );

  return {
    generatedAt: now.toISOString(),
    metrics: {
      totalUsers: realUsers.length,
      newToday: realUsers.filter(
        (user) => shanghaiDateKey(new Date(user.createdAt)) === today,
      ).length,
      active7d: active7d.size,
      learningUsers7d: learningUsers7d.size,
      completedCourses: completedCourseKeys.size,
      costFenToday: llmRows
        .filter(
          (row) =>
            shanghaiDateKey(new Date(row.createdAt)) === today &&
            (!row.userId || !testUserIds.has(row.userId)),
        )
        .reduce((sum, row) => sum + row.actualFen, 0),
    },
    trend,
    funnel: [
      { label: "访问", value: visitors30 },
      { label: "旁听", value: funnelTrial.size },
      { label: "注册", value: funnelRegistered.size },
      { label: "开始学习", value: funnelLearners.size },
      { label: "完成课程", value: funnelCompleted.size },
      { label: "完成选课", value: funnelPaid.size },
    ],
    topPages,
    topCities,
    topPrograms,
    recentUsers,
    trackingSince: realEvents
      .map((event) => event.occurredAt)
      .sort()[0] ?? null,
  };
}

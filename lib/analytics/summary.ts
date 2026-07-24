import { and, desc, gte, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import {
  analyticsEvents,
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

const DAY = 86_400_000;
const MEANINGFUL_EVENTS = new Set([
  "signup_completed",
  "login_succeeded",
  "trial_started",
  "program_enrolled",
  "course_enrolled",
  "course_started",
  "learning_message_sent",
  "exam_submitted",
  "course_completed",
  "agent_message_sent",
  "payment_succeeded",
]);

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
  ]);

  const realUsers = userRows.filter((user) => !isTestEmail(user.email));
  const testUserIds = new Set(
    userRows.filter((user) => isTestEmail(user.email)).map((user) => user.id),
  );
  const realEvents = eventRows.filter(
    (event) => !event.isTest && (!event.userId || !testUserIds.has(event.userId)),
  );
  const realSessions = sessionRows.filter(
    (session) => !session.userId || !testUserIds.has(session.userId),
  );
  const events7d = realEvents.filter(
    (event) => event.occurredAt >= sevenDaysAgo,
  );
  const meaningful7d = events7d.filter((event) =>
    MEANINGFUL_EVENTS.has(event.eventName),
  );
  const active7d = new Set(
    meaningful7d.map(actorKey).filter((key): key is string => Boolean(key)),
  );
  for (const session of realSessions) {
    if (session.updatedAt < sevenDaysAgo) continue;
    const key = actorKey(session);
    if (key) active7d.add(key);
  }
  const learningUsers7d = new Set(
    realSessions
      .filter((session) => session.updatedAt >= sevenDaysAgo)
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
            MEANINGFUL_EVENTS.has(event.eventName),
        )
        .map(actorKey)
        .filter((key): key is string => Boolean(key)),
    ).size;
    return { dateKey, registrations, active };
  });

  const pageCounts = new Map<string, number>();
  for (const event of realEvents) {
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
  for (const event of realEvents) {
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
  const trial30 = new Set(
    realSessions
      .filter(
        (session) =>
          session.nodeSlug === "4p-stp" &&
          session.createdAt >= thirtyDaysAgo,
      )
      .map(actorKey)
      .filter((key): key is string => Boolean(key)),
  ).size;
  const registered30 = realUsers.filter(
    (user) => user.createdAt >= thirtyDaysAgo,
  ).length;
  const learners30 = new Set(
    realSessions
      .filter(
        (session) =>
          session.createdAt >= thirtyDaysAgo && Boolean(session.userId),
      )
      .map((session) => session.userId as string),
  ).size;
  const completed30 = new Set(
    realSessions
      .filter(
        (session) =>
          session.status === "completed" &&
          session.updatedAt >= thirtyDaysAgo &&
          Boolean(session.userId),
      )
      .map((session) => session.userId as string),
  ).size;
  const paid30 = new Set(
    orderRows
      .filter(
        (order) =>
          order.status === "paid" && !testUserIds.has(order.userId),
      )
      .map((order) => order.userId),
  ).size;

  return {
    generatedAt: now.toISOString(),
    metrics: {
      totalUsers: realUsers.length,
      newToday: realUsers.filter(
        (user) => shanghaiDateKey(new Date(user.createdAt)) === today,
      ).length,
      active7d: active7d.size,
      learningUsers7d: learningUsers7d.size,
      completedCourses: realSessions.filter(
        (session) => session.status === "completed",
      ).length,
      costFenToday: llmRows
        .filter(
          (row) => shanghaiDateKey(new Date(row.createdAt)) === today,
        )
        .reduce((sum, row) => sum + row.actualFen, 0),
    },
    trend,
    funnel: [
      { label: "访问", value: visitors30 },
      { label: "旁听", value: trial30 },
      { label: "注册", value: registered30 },
      { label: "开始学习", value: learners30 },
      { label: "完成课程", value: completed30 },
      { label: "完成选课", value: paid30 },
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

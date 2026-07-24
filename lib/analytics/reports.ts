import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import {
  adminAuditLogs,
  adminMembers,
  analyticsEvents,
  analyticsIdentityLinks,
  examAttempts,
  learningSessions,
  llmCallLogs,
  memoryItems,
  orders,
  trackingLinks,
  userCoursePlans,
  userPrograms,
  users,
  walletTransactions,
} from "@/db/schema";
import {
  getUniversityCourse,
  getUniversityProgram,
  universitySchools,
  universityStats,
} from "@/lib/content/university";
import { shanghaiDateKey } from "@/lib/server/api";
import {
  ACTIVE_EVENT_NAMES,
  LEARNING_EVENT_NAMES,
} from "@/lib/analytics/metric-definitions";
import { calculateRevenueMetrics } from "@/lib/analytics/revenue-math";

const DAY = 86_400_000;

type ActorRow = { userId: string | null; guestId?: string | null };

function actorKey(row: ActorRow) {
  if (row.userId) return `u:${row.userId}`;
  if (row.guestId) return `g:${row.guestId}`;
  return null;
}

function isTestEmail(email: string) {
  return email.endsWith("@example.com") || email.includes("+test@");
}

function dateKeys(days: number) {
  return Array.from({ length: days }, (_, index) =>
    shanghaiDateKey(new Date(Date.now() - (days - index - 1) * DAY)),
  );
}

function percentage(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

function latest(...values: Array<string | null | undefined>) {
  return values.filter(Boolean).sort().at(-1) ?? null;
}

async function identityContext() {
  const [rows, links] = await Promise.all([
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
        guestId: analyticsIdentityLinks.guestId,
        userId: analyticsIdentityLinks.userId,
      })
      .from(analyticsIdentityLinks)
      .where(isNull(analyticsIdentityLinks.deletedAt)),
  ]);
  const testUserIds = new Set(
    rows.filter((row) => isTestEmail(row.email)).map((row) => row.id),
  );
  return {
    users: rows.filter((row) => !testUserIds.has(row.id)),
    testUserIds,
    identityByGuest: new Map(
      links.map((link) => [link.guestId, link.userId]),
    ),
  };
}

function resolveEventIdentity<T extends ActorRow>(
  event: T,
  identityByGuest: ReadonlyMap<string, string>,
) {
  return {
    ...event,
    userId:
      event.userId ??
      (event.guestId ? identityByGuest.get(event.guestId) ?? null : null),
  };
}

async function eventRows(since: string) {
  return getDb()
    .select({
      id: analyticsEvents.id,
      eventName: analyticsEvents.eventName,
      dateKey: analyticsEvents.dateKey,
      userId: analyticsEvents.userId,
      guestId: analyticsEvents.guestId,
      path: analyticsEvents.path,
      referrerHost: analyticsEvents.referrerHost,
      schoolSlug: analyticsEvents.schoolSlug,
      programSlug: analyticsEvents.programSlug,
      courseSlug: analyticsEvents.courseSlug,
      trackingLinkId: analyticsEvents.trackingLinkId,
      acquisitionSource: analyticsEvents.acquisitionSource,
      acquisitionMedium: analyticsEvents.acquisitionMedium,
      acquisitionCampaign: analyticsEvents.acquisitionCampaign,
      country: analyticsEvents.country,
      region: analyticsEvents.region,
      city: analyticsEvents.city,
      deviceCategory: analyticsEvents.deviceCategory,
      engagementMs: analyticsEvents.engagementMs,
      occurredAt: analyticsEvents.occurredAt,
      isTest: analyticsEvents.isTest,
    })
    .from(analyticsEvents)
    .where(
      and(
        gte(analyticsEvents.occurredAt, since),
        isNull(analyticsEvents.deletedAt),
      ),
    );
}

export type GrowthReport = Awaited<ReturnType<typeof getGrowthReport>>;

export async function getGrowthReport() {
  const now = Date.now();
  const since = new Date(now - 120 * DAY).toISOString();
  const [
    { users: realUsers, testUserIds, identityByGuest },
    rawEvents,
  ] =
    await Promise.all([
      identityContext(),
      eventRows(since),
    ]);
  const events = rawEvents
    .map((event) => resolveEventIdentity(event, identityByGuest))
    .filter(
      (event) =>
      !event.isTest &&
      (!event.userId || !testUserIds.has(event.userId)),
    );
  const daily = dateKeys(30).map((dateKey) => {
    const dayEvents = events.filter((event) => event.dateKey === dateKey);
    const unique = (names?: ReadonlySet<string>) =>
      new Set(
        dayEvents
          .filter((event) => !names || names.has(event.eventName))
          .map(actorKey)
          .filter((key): key is string => Boolean(key)),
      ).size;
    return {
      dateKey,
      visitors: unique(new Set(["page_view"])),
      registrations: realUsers.filter(
        (user) => shanghaiDateKey(new Date(user.createdAt)) === dateKey,
      ).length,
      active: unique(ACTIVE_EVENT_NAMES),
      learners: unique(LEARNING_EVENT_NAMES),
    };
  });

  const cohortStarts = Array.from({ length: 8 }, (_, index) => {
    const end = now - index * 7 * DAY;
    const start = end - 7 * DAY;
    return { start, end };
  }).reverse();
  const cohorts = cohortStarts.map(({ start, end }) => {
    const cohortUsers = realUsers.filter((user) => {
      const created = new Date(user.createdAt).getTime();
      return created >= start && created < end;
    });
    const retained = (fromDays: number, toDays: number) => {
      if (now < end + fromDays * DAY) return null;
      let count = 0;
      for (const user of cohortUsers) {
        const joined = new Date(user.createdAt).getTime();
        if (
          events.some((event) => {
            if (
              event.userId !== user.id ||
              !ACTIVE_EVENT_NAMES.has(event.eventName)
            ) {
              return false;
            }
            const time = new Date(event.occurredAt).getTime();
            return (
              time >= joined + fromDays * DAY &&
              time < joined + toDays * DAY
            );
          })
        ) {
          count += 1;
        }
      }
      return percentage(count, cohortUsers.length);
    };
    return {
      label: shanghaiDateKey(new Date(start)).slice(5),
      users: cohortUsers.length,
      day1: retained(1, 3),
      day7: retained(7, 14),
      day30: retained(30, 37),
    };
  });

  const actorEvents = new Map<string, typeof events>();
  for (const event of events) {
    const actor = actorKey(event);
    if (!actor) continue;
    const rows = actorEvents.get(actor) ?? [];
    rows.push(event);
    actorEvents.set(actor, rows);
  }
  const sourceGroups = new Map<
    string,
    { source: string; visitors: Set<string>; signups: Set<string>; learners: Set<string> }
  >();
  for (const [actor, rows] of actorEvents) {
    const ordered = [...rows].sort((a, b) =>
      a.occurredAt.localeCompare(b.occurredAt),
    );
    const source =
      ordered.find((event) => event.acquisitionSource)?.acquisitionSource ??
      ordered.find(
        (event) => event.eventName === "page_view" && event.referrerHost,
      )?.referrerHost ??
      "直接访问";
    const group = sourceGroups.get(source) ?? {
      source,
      visitors: new Set<string>(),
      signups: new Set<string>(),
      learners: new Set<string>(),
    };
    if (ordered.some((event) => event.eventName === "page_view")) {
      group.visitors.add(actor);
    }
    if (ordered.some((event) => event.eventName === "signup_completed")) {
      group.signups.add(actor);
    }
    if (
      ordered.some((event) => LEARNING_EVENT_NAMES.has(event.eventName))
    ) {
      group.learners.add(actor);
    }
    sourceGroups.set(source, group);
  }
  const sources = [...sourceGroups.values()]
    .sort((a, b) => b.visitors.size - a.visitors.size)
    .slice(0, 10)
    .map((group) => ({
      source: group.source,
      visitors: group.visitors.size,
      signups: group.signups.size,
      learners: group.learners.size,
      signupRate: percentage(group.signups.size, group.visitors.size),
    }));

  const last7 = daily.slice(-7);
  const previous7 = daily.slice(-14, -7);
  const change = (current: number, previous: number) =>
    previous ? Math.round(((current - previous) / previous) * 100) : null;
  const periodActors = (
    start: number,
    end: number,
    names: ReadonlySet<string>,
  ) =>
    new Set(
      events
        .filter((event) => {
          const time = new Date(event.occurredAt).getTime();
          return (
            time >= start &&
            time < end &&
            names.has(event.eventName)
          );
        })
        .map(actorKey)
        .filter((key): key is string => Boolean(key)),
    ).size;
  const currentStart = now - 7 * DAY;
  const previousStart = now - 14 * DAY;
  const visitorEvents = new Set(["page_view"]);
  const learnerEvents = LEARNING_EVENT_NAMES;
  const visitors7d = periodActors(currentStart, now + 1, visitorEvents);
  const visitorsPrevious7d = periodActors(
    previousStart,
    currentStart,
    visitorEvents,
  );
  const active7d = periodActors(currentStart, now + 1, ACTIVE_EVENT_NAMES);
  const activePrevious7d = periodActors(
    previousStart,
    currentStart,
    ACTIVE_EVENT_NAMES,
  );
  const learners7d = periodActors(currentStart, now + 1, learnerEvents);
  const learnersPrevious7d = periodActors(
    previousStart,
    currentStart,
    learnerEvents,
  );
  const registrations7d = last7.reduce(
    (total, row) => total + row.registrations,
    0,
  );
  const registrationsPrevious7d = previous7.reduce(
    (total, row) => total + row.registrations,
    0,
  );

  const visitorActors30 = new Set(
    events
      .filter(
        (event) =>
          event.eventName === "page_view" &&
          new Date(event.occurredAt).getTime() >= now - 30 * DAY,
      )
      .map(actorKey)
      .filter((key): key is string => Boolean(key)),
  );
  const registeredActors30 = new Set(
    realUsers
      .filter(
        (user) => new Date(user.createdAt).getTime() >= now - 30 * DAY,
      )
      .map((user) => `u:${user.id}`),
  );
  const learnerActors30 = new Set(
    events
      .filter(
        (event) =>
          LEARNING_EVENT_NAMES.has(event.eventName) &&
          new Date(event.occurredAt).getTime() >= now - 30 * DAY,
      )
      .map(actorKey)
      .filter((key): key is string => Boolean(key)),
  );
  const passedAttempts = await getDb()
    .select({
      userId: examAttempts.userId,
      passed: examAttempts.passed,
      createdAt: examAttempts.createdAt,
    })
    .from(examAttempts)
    .where(
      and(
        gte(examAttempts.createdAt, new Date(now - 30 * DAY).toISOString()),
        isNull(examAttempts.deletedAt),
      ),
    );
  const completedActors30 = new Set(
    passedAttempts
      .filter(
        (attempt) =>
          attempt.passed && !testUserIds.has(attempt.userId),
      )
      .map((attempt) => `u:${attempt.userId}`),
  );
  const intersect = (left: Set<string>, right: Set<string>) =>
    new Set([...left].filter((key) => right.has(key)));
  const funnelRegistered = intersect(visitorActors30, registeredActors30);
  const funnelLearners = intersect(funnelRegistered, learnerActors30);
  const funnelCompleted = intersect(funnelLearners, completedActors30);

  return {
    generatedAt: new Date(now).toISOString(),
    metrics: {
      visitors7d,
      visitorsChange: change(visitors7d, visitorsPrevious7d),
      registrations7d,
      registrationsChange: change(
        registrations7d,
        registrationsPrevious7d,
      ),
      active7d,
      activeChange: change(active7d, activePrevious7d),
      learners7d,
      learnersChange: change(learners7d, learnersPrevious7d),
    },
    daily,
    cohorts,
    sources,
    funnel: [
      { label: "访问", value: visitorActors30.size },
      { label: "注册", value: funnelRegistered.size },
      { label: "进入学习", value: funnelLearners.size },
      { label: "完成课程", value: funnelCompleted.size },
    ],
  };
}

export type AcademicsReport = Awaited<
  ReturnType<typeof getAcademicsReport>
>;

export async function getAcademicsReport() {
  const since = new Date(Date.now() - 180 * DAY).toISOString();
  const [{ testUserIds }, programs, plans, sessions, attempts] =
    await Promise.all([
      identityContext(),
      getDb()
        .select()
        .from(userPrograms)
        .where(isNull(userPrograms.deletedAt)),
      getDb()
        .select()
        .from(userCoursePlans)
        .where(isNull(userCoursePlans.deletedAt)),
      getDb()
        .select()
        .from(learningSessions)
        .where(
          and(
            gte(learningSessions.createdAt, since),
            isNull(learningSessions.deletedAt),
          ),
        ),
      getDb()
        .select()
        .from(examAttempts)
        .where(
          and(
            gte(examAttempts.createdAt, since),
            isNull(examAttempts.deletedAt),
          ),
        ),
    ]);
  const realPrograms = programs.filter(
    (row) => !testUserIds.has(row.userId),
  );
  const realPlans = plans.filter((row) => !testUserIds.has(row.userId));
  const realSessions = sessions.filter(
    (row) => !row.userId || !testUserIds.has(row.userId),
  );
  const realAttempts = attempts.filter(
    (row) => !testUserIds.has(row.userId),
  );

  const programRows = universitySchools.flatMap((school) =>
    school.programs.map((program) => {
      const enrolled = new Set(
        realPrograms
          .filter((row) => row.programSlug === program.slug)
          .map((row) => row.userId),
      );
      const planned = new Set(
        realPlans
          .filter((row) => row.programSlug === program.slug)
          .map((row) => row.userId),
      );
      const courseSlugs = new Set(program.courses.map((course) => course.slug));
      const started = new Set(
        realSessions
          .filter(
            (session) =>
              courseSlugs.has(session.nodeSlug) && Boolean(session.userId),
          )
          .map((session) => session.userId as string),
      );
      const completed = new Set(
        realAttempts
          .filter(
            (attempt) =>
              attempt.passed && courseSlugs.has(attempt.nodeSlug),
          )
          .map((attempt) => attempt.userId),
      );
      return {
        schoolSlug: school.slug,
        school: school.name,
        programSlug: program.slug,
        program: program.name,
        credits: program.requiredCredits,
        courses: program.courses.length,
        enrolled: enrolled.size,
        planned: planned.size,
        started: started.size,
        completed: completed.size,
      };
    }),
  );
  const schoolRows = universitySchools
    .map((school) => {
      const programSlugs = new Set(
        school.programs.map((program) => program.slug),
      );
      const courseSlugs = new Set(
        school.programs.flatMap((program) =>
          program.courses.map((course) => course.slug),
        ),
      );
      return {
        schoolSlug: school.slug,
        school: school.name,
        discipline: school.discipline,
        programs: school.programs.length,
        courses: school.programs.reduce(
          (total, program) => total + program.courses.length,
          0,
        ),
        enrolled: new Set(
          realPrograms
            .filter((row) => programSlugs.has(row.programSlug))
            .map((row) => row.userId),
        ).size,
        learners: new Set(
          realSessions
            .filter(
              (row) => row.userId && courseSlugs.has(row.nodeSlug),
            )
            .map((row) => row.userId as string),
        ).size,
      };
    })
    .sort((a, b) => b.enrolled - a.enrolled);

  const courseMap = new Map<
    string,
    {
      courseSlug: string;
      course: string;
      program: string;
      school: string;
      credits: number;
      planned: Set<string>;
      learners: Set<string>;
      completed: Set<string>;
      scores: number[];
    }
  >();
  for (const plan of realPlans) {
    const academic = getUniversityCourse(plan.courseSlug);
    if (!academic) continue;
    const row = courseMap.get(plan.courseSlug) ?? {
      courseSlug: plan.courseSlug,
      course: academic.course.title,
      program: academic.program.name,
      school: academic.school.name,
      credits: academic.course.credits,
      planned: new Set<string>(),
      learners: new Set<string>(),
      completed: new Set<string>(),
      scores: [],
    };
    row.planned.add(plan.userId);
    courseMap.set(plan.courseSlug, row);
  }
  for (const session of realSessions) {
    if (!session.userId) continue;
    const academic = getUniversityCourse(session.nodeSlug);
    if (!academic) continue;
    const row = courseMap.get(session.nodeSlug) ?? {
      courseSlug: session.nodeSlug,
      course: academic.course.title,
      program: academic.program.name,
      school: academic.school.name,
      credits: academic.course.credits,
      planned: new Set<string>(),
      learners: new Set<string>(),
      completed: new Set<string>(),
      scores: [],
    };
    row.learners.add(session.userId);
    courseMap.set(session.nodeSlug, row);
  }
  for (const attempt of realAttempts) {
    const academic = getUniversityCourse(attempt.nodeSlug);
    if (!academic) continue;
    const row = courseMap.get(attempt.nodeSlug) ?? {
      courseSlug: attempt.nodeSlug,
      course: academic.course.title,
      program: academic.program.name,
      school: academic.school.name,
      credits: academic.course.credits,
      planned: new Set<string>(),
      learners: new Set<string>(),
      completed: new Set<string>(),
      scores: [],
    };
    row.scores.push(attempt.score);
    if (attempt.passed) row.completed.add(attempt.userId);
    courseMap.set(attempt.nodeSlug, row);
  }
  const courses = [...courseMap.values()]
    .map((row) => ({
      courseSlug: row.courseSlug,
      course: row.course,
      program: row.program,
      school: row.school,
      credits: row.credits,
      planned: row.planned.size,
      learners: row.learners.size,
      completed: row.completed.size,
      averageScore: row.scores.length
        ? Math.round(
            row.scores.reduce((total, score) => total + score, 0) /
              row.scores.length,
          )
        : null,
    }))
    .sort(
      (a, b) =>
        b.learners + b.planned + b.completed -
        (a.learners + a.planned + a.completed),
    )
    .slice(0, 20);

  return {
    metrics: {
      schools: universityStats.schools,
      programs: universityStats.programs,
      courses: universityStats.courses,
      enrolled: new Set(realPrograms.map((row) => row.userId)).size,
      activeLearners: new Set(
        realSessions
          .filter((row) => row.userId)
          .map((row) => row.userId as string),
      ).size,
      creditsEarned: [
        ...new Map(
          realAttempts
            .filter((row) => row.passed)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .map((row) => [`${row.userId}|${row.nodeSlug}`, row]),
        ).values(),
      ].reduce((total, row) => total + row.creditsEarned, 0),
    },
    schools: schoolRows,
    programs: programRows
      .sort((a, b) => b.enrolled - a.enrolled)
      .slice(0, 30),
    courses,
  };
}

export type GeoReport = Awaited<ReturnType<typeof getGeoReport>>;

export async function getGeoReport() {
  const since = new Date(Date.now() - 90 * DAY).toISOString();
  const [{ testUserIds, identityByGuest }, rawEvents] = await Promise.all([
    identityContext(),
    eventRows(since),
  ]);
  const events = rawEvents
    .map((event) => resolveEventIdentity(event, identityByGuest))
    .filter(
      (event) =>
      !event.isTest &&
      (!event.userId || !testUserIds.has(event.userId)),
    );
  const cities = new Map<
    string,
    {
      country: string;
      region: string;
      city: string;
      actors: Set<string>;
      registrations: Set<string>;
      learners: Set<string>;
    }
  >();
  for (const event of events) {
    if (!event.city) continue;
    const key = `${event.country ?? ""}|${event.region ?? ""}|${event.city}`;
    const row = cities.get(key) ?? {
      country: event.country ?? "未知",
      region: event.region ?? "未知",
      city: event.city,
      actors: new Set<string>(),
      registrations: new Set<string>(),
      learners: new Set<string>(),
    };
    const actor = actorKey(event);
    if (actor && event.eventName === "page_view") row.actors.add(actor);
    if (actor && event.eventName === "signup_completed") {
      row.registrations.add(actor);
    }
    if (
      actor &&
      [
        "course_started",
        "learning_message_sent",
        "course_completed",
      ].includes(event.eventName)
    ) {
      row.learners.add(actor);
    }
    cities.set(key, row);
  }
  const cityRows = [...cities.values()]
    .map((row) => ({
      country: row.country,
      region: row.region,
      city: row.city,
      visitors: row.actors.size,
      registrations: row.registrations.size,
      learners: row.learners.size,
      signupRate: percentage(row.registrations.size, row.actors.size),
    }))
    .sort((a, b) => b.visitors - a.visitors);

  const devices = new Map<string, Set<string>>();
  const referrers = new Map<string, Set<string>>();
  for (const event of events.filter((row) => row.eventName === "page_view")) {
    const actor = actorKey(event);
    if (!actor) continue;
    const device = event.deviceCategory ?? "未知设备";
    const deviceActors = devices.get(device) ?? new Set<string>();
    deviceActors.add(actor);
    devices.set(device, deviceActors);
    if (event.referrerHost) {
      const referrerActors =
        referrers.get(event.referrerHost) ?? new Set<string>();
      referrerActors.add(actor);
      referrers.set(event.referrerHost, referrerActors);
    }
  }
  return {
    metrics: {
      countries: new Set(cityRows.map((row) => row.country)).size,
      regions: new Set(
        cityRows.map((row) => `${row.country}|${row.region}`),
      ).size,
      cities: cityRows.length,
      identifiedVisitors: new Set(
        events
          .filter(
            (event) => event.eventName === "page_view" && event.city,
          )
          .map(actorKey)
          .filter((key): key is string => Boolean(key)),
      ).size,
    },
    cities: cityRows.slice(0, 50),
    devices: [...devices.entries()]
      .map(([label, actors]) => ({ label, users: actors.size }))
      .sort((a, b) => b.users - a.users),
    referrers: [...referrers.entries()]
      .map(([host, actors]) => ({ host, users: actors.size }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 12),
  };
}

export type UsersReport = Awaited<ReturnType<typeof getUsersReport>>;

export async function getUsersReport(search = "") {
  const since = new Date(Date.now() - 180 * DAY).toISOString();
  const [{ users: realUsers, testUserIds, identityByGuest }, programs, plans, sessions, attempts, orderRows, rawEvents] =
    await Promise.all([
      identityContext(),
      getDb().select().from(userPrograms).where(isNull(userPrograms.deletedAt)),
      getDb()
        .select()
        .from(userCoursePlans)
        .where(isNull(userCoursePlans.deletedAt)),
      getDb()
        .select()
        .from(learningSessions)
        .where(isNull(learningSessions.deletedAt)),
      getDb()
        .select()
        .from(examAttempts)
        .where(isNull(examAttempts.deletedAt)),
      getDb().select().from(orders).where(isNull(orders.deletedAt)),
      eventRows(since),
    ]);
  const events = rawEvents.map((event) =>
    resolveEventIdentity(event, identityByGuest),
  );
  const cleanSearch = search.trim().toLowerCase().slice(0, 100);
  const filteredUsers = realUsers.filter(
    (user) =>
      !cleanSearch ||
      user.email.toLowerCase().includes(cleanSearch) ||
      user.name?.toLowerCase().includes(cleanSearch),
  );
  const rows = filteredUsers.slice(0, 100).map((user) => {
    const userEvents = events.filter(
      (event) => event.userId === user.id && !event.isTest,
    );
    const userSessions = sessions.filter(
      (session) => session.userId === user.id,
    );
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      verified: Boolean(user.emailVerifiedAt),
      createdAt: user.createdAt,
      lastActiveAt: latest(
        user.lastLoginAt,
        ...userEvents.map((event) => event.occurredAt),
        ...userSessions.map((session) => session.updatedAt),
      ),
      city:
        userEvents
          .filter((event) => event.city)
          .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0]
          ?.city ?? null,
      programs: programs.filter(
        (program) =>
          program.userId === user.id && !testUserIds.has(program.userId),
      ).length,
      courses: plans.filter((plan) => plan.userId === user.id).length,
      completed: new Set(
        attempts
          .filter((attempt) => attempt.userId === user.id && attempt.passed)
          .map((attempt) => attempt.nodeSlug),
      ).size,
      spendFen: orderRows
        .filter(
          (order) =>
            order.userId === user.id &&
            order.status === "paid" &&
            order.paymentMode === "production",
        )
        .reduce((total, order) => total + order.amountFen, 0),
    };
  });
  return {
    metrics: {
      total: realUsers.length,
      verified: realUsers.filter((user) => user.emailVerifiedAt).length,
      active30d: new Set(
        events
          .filter(
            (event) =>
              event.userId &&
              !event.isTest &&
              new Date(event.occurredAt).getTime() >= Date.now() - 30 * DAY &&
              ACTIVE_EVENT_NAMES.has(event.eventName),
          )
          .map((event) => event.userId as string),
      ).size,
      paying: new Set(
        orderRows
          .filter(
            (order) =>
              order.status === "paid" &&
              order.paymentMode === "production" &&
              !testUserIds.has(order.userId),
          )
          .map((order) => order.userId),
      ).size,
    },
    search: cleanSearch,
    totalMatches: filteredUsers.length,
    users: rows,
  };
}

export async function getUserReport(userId: string) {
  const [user] = await getDb()
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
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);
  if (!user || isTestEmail(user.email)) return null;

  const [programs, plans, sessions, attempts, orderRows, events, memories] =
    await Promise.all([
      getDb()
        .select()
        .from(userPrograms)
        .where(
          and(
            eq(userPrograms.userId, userId),
            isNull(userPrograms.deletedAt),
          ),
        ),
      getDb()
        .select()
        .from(userCoursePlans)
        .where(
          and(
            eq(userCoursePlans.userId, userId),
            isNull(userCoursePlans.deletedAt),
          ),
        ),
      getDb()
        .select()
        .from(learningSessions)
        .where(
          and(
            eq(learningSessions.userId, userId),
            isNull(learningSessions.deletedAt),
          ),
        ),
      getDb()
        .select()
        .from(examAttempts)
        .where(
          and(
            eq(examAttempts.userId, userId),
            isNull(examAttempts.deletedAt),
          ),
        ),
      getDb()
        .select()
        .from(orders)
        .where(and(eq(orders.userId, userId), isNull(orders.deletedAt))),
      getDb()
        .select({
          eventName: analyticsEvents.eventName,
          city: analyticsEvents.city,
          acquisitionSource: analyticsEvents.acquisitionSource,
          path: analyticsEvents.path,
          occurredAt: analyticsEvents.occurredAt,
        })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.userId, userId),
            isNull(analyticsEvents.deletedAt),
          ),
        )
        .orderBy(desc(analyticsEvents.occurredAt))
        .limit(50),
      getDb()
        .select({ id: memoryItems.id })
        .from(memoryItems)
        .where(
          and(
            eq(memoryItems.userId, userId),
            isNull(memoryItems.deletedAt),
          ),
        ),
    ]);
  return {
    user: {
      ...user,
      verified: Boolean(user.emailVerifiedAt),
      city: events.find((event) => event.city)?.city ?? null,
      source:
        events.find((event) => event.acquisitionSource)?.acquisitionSource ??
        "直接访问",
      memories: memories.length,
      lastActiveAt: latest(
        user.lastLoginAt,
        events[0]?.occurredAt,
        ...sessions.map((session) => session.updatedAt),
      ),
    },
    programs: programs.map((row) => ({
      ...row,
      name: getUniversityProgram(row.programSlug)?.name ?? row.programSlug,
    })),
    courses: plans.map((row) => ({
      ...row,
      title:
        getUniversityCourse(row.courseSlug)?.course.title ?? row.courseSlug,
    })),
    sessions: sessions
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 30)
      .map((row) => ({
        ...row,
        title:
          getUniversityCourse(row.nodeSlug)?.course.title ?? row.nodeSlug,
      })),
    attempts: attempts
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 30)
      .map((row) => ({
        ...row,
        title:
          getUniversityCourse(row.nodeSlug)?.course.title ?? row.nodeSlug,
      })),
    orders: orderRows.sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    ),
    events,
  };
}

export type TrackingReport = Awaited<
  ReturnType<typeof getTrackingReport>
>;

export async function getTrackingReport() {
  const since = new Date(Date.now() - 365 * DAY).toISOString();
  const [{ testUserIds, identityByGuest }, links, rawEvents] = await Promise.all([
    identityContext(),
    getDb()
      .select()
      .from(trackingLinks)
      .where(isNull(trackingLinks.deletedAt))
      .orderBy(desc(trackingLinks.createdAt)),
    eventRows(since),
  ]);
  const events = rawEvents
    .map((event) => resolveEventIdentity(event, identityByGuest))
    .filter(
      (event) =>
      !event.isTest &&
      (!event.userId || !testUserIds.has(event.userId)),
    );
  const rows = links.map((link) => {
    const attributed = events.filter(
      (event) => event.trackingLinkId === link.id,
    );
    const actors = (name?: string) =>
      new Set(
        attributed
          .filter((event) => !name || event.eventName === name)
          .map(actorKey)
          .filter((key): key is string => Boolean(key)),
      ).size;
    const visitors = actors("tracking_link_clicked");
    const signups = actors("signup_completed");
    const learners = new Set(
      attributed
        .filter((event) =>
          [
            "course_started",
            "learning_message_sent",
            "course_completed",
          ].includes(event.eventName),
        )
        .map(actorKey)
        .filter((key): key is string => Boolean(key)),
    ).size;
    const payments = actors("payment_succeeded");
    return {
      ...link,
      visitors,
      signups,
      learners,
      payments,
      signupRate: percentage(signups, visitors),
    };
  });
  return {
    metrics: {
      links: links.length,
      active: links.filter((link) => link.status === "active").length,
      visitors: rows.reduce((total, row) => total + row.visitors, 0),
      signups: rows.reduce((total, row) => total + row.signups, 0),
      learners: rows.reduce((total, row) => total + row.learners, 0),
    },
    links: rows,
  };
}

function monthKey(value: string | Date) {
  return shanghaiDateKey(
    typeof value === "string" ? new Date(value) : value,
  ).slice(0, 7);
}

function recentMonthKeys(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() - (count - index - 1),
        1,
      ),
    );
    return monthKey(date);
  });
}

export type RevenueReport = Awaited<ReturnType<typeof getRevenueReport>>;

export async function getRevenueReport() {
  const [
    { users: realUsers, testUserIds },
    allOrders,
    llmRows,
    walletRows,
  ] = await Promise.all([
    identityContext(),
    getDb().select().from(orders).where(isNull(orders.deletedAt)),
    getDb()
      .select({
        userId: llmCallLogs.userId,
        actualFen: llmCallLogs.actualFen,
      })
      .from(llmCallLogs)
      .where(isNull(llmCallLogs.deletedAt)),
    getDb()
      .select({
        userId: walletTransactions.userId,
        type: walletTransactions.type,
        amountFen: walletTransactions.amountFen,
      })
      .from(walletTransactions)
      .where(isNull(walletTransactions.deletedAt)),
  ]);
  const cleanOrders = allOrders.filter(
    (order) => !testUserIds.has(order.userId),
  );
  const productionOrders = cleanOrders.filter(
    (order) => order.paymentMode === "production",
  );
  const testOrders = cleanOrders.filter(
    (order) => order.paymentMode === "test",
  );
  const production = calculateRevenueMetrics(
    realUsers.length,
    productionOrders,
  );
  const simulation = calculateRevenueMetrics(realUsers.length, [
    ...testOrders.map((order) => ({
      ...order,
      paymentMode: "production",
    })),
  ]);
  const modelCostFen = llmRows
    .filter((row) => !row.userId || !testUserIds.has(row.userId))
    .reduce((total, row) => total + row.actualFen, 0);
  const testWalletTopupFen = walletRows
    .filter(
      (row) =>
        row.type === "test_topup" && !testUserIds.has(row.userId),
    )
    .reduce((total, row) => total + row.amountFen, 0);

  const months = recentMonthKeys(12).map((month) => {
    const total = (rows: typeof cleanOrders) =>
      rows
        .filter(
          (order) =>
            order.status === "paid" &&
            order.confirmedAt &&
            monthKey(order.confirmedAt) === month,
        )
        .reduce((sum, order) => sum + order.amountFen, 0);
    return {
      month,
      productionFen: total(productionOrders),
      testFen: total(testOrders),
    };
  });

  const userById = new Map(realUsers.map((user) => [user.id, user]));
  const cohorts = recentMonthKeys(8)
    .map((cohort) => {
      const cohortUsers = realUsers.filter(
        (user) => monthKey(user.createdAt) === cohort,
      );
      const cohortIds = new Set(cohortUsers.map((user) => user.id));
      const cohortOrders = productionOrders.filter((order) =>
        cohortIds.has(order.userId),
      );
      const metrics = calculateRevenueMetrics(
        cohortUsers.length,
        cohortOrders,
      );
      return {
        cohort,
        registered: cohortUsers.length,
        payers: metrics.payerCount,
        conversionRate: metrics.conversionRate,
        netRevenueFen: metrics.netRevenueFen,
        observedLtvFen: metrics.arpuFen,
      };
    })
    .reverse();

  const courseGroups = new Map<
    string,
    {
      nodeSlug: string;
      title: string;
      productionFen: number;
      testFen: number;
      productionPayers: Set<string>;
      testPayers: Set<string>;
    }
  >();
  for (const order of cleanOrders.filter(
    (row) => row.status === "paid",
  )) {
    const academic = getUniversityCourse(order.nodeSlug);
    const row = courseGroups.get(order.nodeSlug) ?? {
      nodeSlug: order.nodeSlug,
      title: academic?.course.title ?? order.nodeSlug,
      productionFen: 0,
      testFen: 0,
      productionPayers: new Set<string>(),
      testPayers: new Set<string>(),
    };
    if (order.paymentMode === "production") {
      row.productionFen += order.amountFen;
      row.productionPayers.add(order.userId);
    } else {
      row.testFen += order.amountFen;
      row.testPayers.add(order.userId);
    }
    courseGroups.set(order.nodeSlug, row);
  }

  const ltvCurve = [0, 1, 2, 3, 6].map((ageMonths) => {
    const eligibleUsers = realUsers.filter((user) => {
      const joined = new Date(user.createdAt);
      const cutoff = new Date(
        joined.getFullYear(),
        joined.getMonth() + ageMonths + 1,
        1,
      );
      return cutoff.getTime() <= Date.now();
    });
    const eligibleIds = new Set(eligibleUsers.map((user) => user.id));
    const revenueFen = productionOrders
      .filter((order) => {
        if (
          order.status !== "paid" ||
          !order.confirmedAt ||
          !eligibleIds.has(order.userId)
        ) {
          return false;
        }
        const joined = new Date(userById.get(order.userId)!.createdAt);
        const cutoff = new Date(
          joined.getFullYear(),
          joined.getMonth() + ageMonths + 1,
          1,
        );
        return new Date(order.confirmedAt).getTime() < cutoff.getTime();
      })
      .reduce((total, order) => total + order.amountFen, 0);
    return {
      label: `M${ageMonths}`,
      users: eligibleUsers.length,
      ltvFen: eligibleUsers.length
        ? Math.round(revenueFen / eligibleUsers.length)
        : 0,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    production: {
      ...production,
      modelCostFen,
      contributionFen: production.netRevenueFen - modelCostFen,
    },
    simulation: {
      ...simulation,
      testWalletTopupFen,
    },
    months,
    cohorts,
    ltvCurve,
    courses: [...courseGroups.values()]
      .map((row) => ({
        ...row,
        productionPayers: row.productionPayers.size,
        testPayers: row.testPayers.size,
      }))
      .sort(
        (a, b) =>
          b.productionFen + b.testFen - (a.productionFen + a.testFen),
      )
      .slice(0, 20),
  };
}

export async function getTeamReport() {
  const [members, audits] = await Promise.all([
    getDb()
      .select()
      .from(adminMembers)
      .where(isNull(adminMembers.deletedAt))
      .orderBy(desc(adminMembers.createdAt)),
    getDb()
      .select()
      .from(adminAuditLogs)
      .where(isNull(adminAuditLogs.deletedAt))
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(40),
  ]);
  return { members, audits };
}

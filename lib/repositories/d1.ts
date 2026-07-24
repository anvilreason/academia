import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  authRateLimits,
  agentMessages,
  agentThreads,
  guestTrialUsage,
  examAttempts,
  learningNotes,
  learningSessions,
  llmCallLogs,
  messages,
  memoryItems,
  nodeEntitlements,
  orders,
  practiceProjects,
  userCoursePlans,
  userPrograms,
  users,
  walletAccounts,
  walletTransactions,
} from "@/db/schema";
import { newId, nowIso } from "@/lib/server/api";
import type {
  AcademiaRepository,
  AgentMessageRecord,
  AgentThreadRecord,
  ExamAttemptRecord,
  LearningSessionRecord,
  MessageRecord,
  MemoryItemRecord,
  NoteRecord,
  OrderRecord,
  PracticeProjectRecord,
  UserCoursePlanRecord,
  UserProgramRecord,
  UserRecord,
  WalletRecord,
} from "./types";

function asUser(row: typeof users.$inferSelect): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    passwordSalt: row.passwordSalt,
    passwordIterations: row.passwordIterations,
    passwordAlgorithm: row.passwordAlgorithm,
    name: row.name,
    status: row.status,
    emailVerifiedAt: row.emailVerifiedAt,
    lastLoginAt: row.lastLoginAt,
  };
}

function asSession(
  row: typeof learningSessions.$inferSelect,
): LearningSessionRecord {
  return row;
}

function asMessage(row: typeof messages.$inferSelect): MessageRecord {
  return {
    id: row.id,
    sessionId: row.sessionId,
    role: row.role,
    content: row.content,
    idempotencyKey: row.idempotencyKey,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    createdAt: row.createdAt,
  };
}

function asOrder(row: typeof orders.$inferSelect): OrderRecord {
  return {
    id: row.id,
    userId: row.userId,
    nodeSlug: row.nodeSlug,
    amountFen: row.amountFen,
    status: row.status,
    idempotencyKey: row.idempotencyKey,
    confirmedAt: row.confirmedAt,
    createdAt: row.createdAt,
  };
}

function asNote(row: typeof learningNotes.$inferSelect): NoteRecord {
  return {
    id: row.id,
    userId: row.userId,
    sessionId: row.sessionId,
    nodeSlug: row.nodeSlug,
    title: row.title,
    content: row.content,
    createdAt: row.createdAt,
  };
}

function asProgram(row: typeof userPrograms.$inferSelect): UserProgramRecord {
  return row;
}

function asCoursePlan(
  row: typeof userCoursePlans.$inferSelect,
): UserCoursePlanRecord {
  return row;
}

function asExam(row: typeof examAttempts.$inferSelect): ExamAttemptRecord {
  return {
    id: row.id,
    userId: row.userId,
    sessionId: row.sessionId,
    nodeSlug: row.nodeSlug,
    attemptNumber: row.attemptNumber,
    score: row.score,
    gradePoint: row.gradePointHundredths / 100,
    creditsAttempted: row.creditsAttempted,
    creditsEarned: row.creditsEarned,
    passed: row.passed,
    weakTopics: JSON.parse(row.weakTopicsJson) as string[],
    createdAt: row.createdAt,
  };
}

function asWallet(row: typeof walletAccounts.$inferSelect): WalletRecord {
  return row;
}

function asPracticeProject(
  row: typeof practiceProjects.$inferSelect,
): PracticeProjectRecord {
  return row;
}

function asAgentThread(
  row: typeof agentThreads.$inferSelect,
): AgentThreadRecord {
  return row;
}

function asAgentMessage(
  row: typeof agentMessages.$inferSelect,
): AgentMessageRecord {
  return {
    id: row.id,
    threadId: row.threadId,
    role: row.role,
    content: row.content,
    idempotencyKey: row.idempotencyKey,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    createdAt: row.createdAt,
  };
}

function asMemoryItem(
  row: typeof memoryItems.$inferSelect,
): MemoryItemRecord {
  return row;
}

export class D1AcademiaRepository implements AcademiaRepository {
  async findUserByEmail(email: string) {
    const [row] = await getDb()
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
      .limit(1);
    return row ? asUser(row) : null;
  }

  async createUser(input: {
    email: string;
    passwordHash: string;
    passwordSalt: string;
    passwordIterations: number;
    passwordAlgorithm: string;
    name?: string;
  }) {
    const now = nowIso();
    const [row] = await getDb()
      .insert(users)
      .values({
        id: newId(),
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        passwordSalt: input.passwordSalt,
        passwordIterations: input.passwordIterations,
        passwordAlgorithm: input.passwordAlgorithm,
        name: input.name?.trim() || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return asUser(row);
  }

  async recordUserLogin(userId: string) {
    const now = nowIso();
    await getDb()
      .update(users)
      .set({ lastLoginAt: now, updatedAt: now })
      .where(and(eq(users.id, userId), isNull(users.deletedAt)));
  }

  async consumeAuthRateLimit(input: {
    action: "register" | "login";
    subjectHash: string;
    windowKey: string;
    limit: number;
  }) {
    const now = nowIso();
    const [row] = await getDb()
      .insert(authRateLimits)
      .values({
        id: newId(),
        action: input.action,
        subjectHash: input.subjectHash,
        windowKey: input.windowKey,
        count: 1,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          authRateLimits.action,
          authRateLimits.subjectHash,
          authRateLimits.windowKey,
        ],
        set: {
          count: sql`${authRateLimits.count} + 1`,
          updatedAt: now,
        },
      })
      .returning({ count: authRateLimits.count });
    return row.count <= input.limit;
  }

  async claimGuestSessions(guestId: string, userId: string) {
    await getDb()
      .update(learningSessions)
      .set({ userId, guestId: null, updatedAt: nowIso() })
      .where(
        and(
          eq(learningSessions.guestId, guestId),
          isNull(learningSessions.userId),
          isNull(learningSessions.deletedAt),
        ),
      );
  }

  async createLearningSession(input: {
    nodeSlug: string;
    userId?: string | null;
    guestId?: string | null;
  }) {
    const now = nowIso();
    const [row] = await getDb()
      .insert(learningSessions)
      .values({
        id: newId(),
        nodeSlug: input.nodeSlug,
        userId: input.userId ?? null,
        guestId: input.guestId ?? null,
        status: "active",
        turnCount: 0,
        progress: 0,
        promptVersion: "socratic-zh-v1",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return asSession(row);
  }

  async getLearningSession(id: string) {
    const [row] = await getDb()
      .select()
      .from(learningSessions)
      .where(
        and(eq(learningSessions.id, id), isNull(learningSessions.deletedAt)),
      )
      .limit(1);
    return row ? asSession(row) : null;
  }

  async listMessages(sessionId: string) {
    const rows = await getDb()
      .select()
      .from(messages)
      .where(
        and(eq(messages.sessionId, sessionId), isNull(messages.deletedAt)),
      )
      .orderBy(asc(messages.createdAt), asc(messages.id));
    return rows.map(asMessage);
  }

  async findMessageByIdempotency(
    sessionId: string,
    role: "user" | "assistant",
    idempotencyKey: string,
  ) {
    const [row] = await getDb()
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.sessionId, sessionId),
          eq(messages.role, role),
          eq(messages.idempotencyKey, idempotencyKey),
          isNull(messages.deletedAt),
        ),
      )
      .limit(1);
    return row ? asMessage(row) : null;
  }

  async appendMessage(input: {
    sessionId: string;
    role: "user" | "assistant";
    content: string;
    idempotencyKey?: string | null;
    inputTokens?: number;
    outputTokens?: number;
  }) {
    const now = nowIso();
    const [row] = await getDb()
      .insert(messages)
      .values({
        id: newId(),
        sessionId: input.sessionId,
        role: input.role,
        content: input.content,
        idempotencyKey: input.idempotencyKey ?? null,
        inputTokens: input.inputTokens ?? null,
        outputTokens: input.outputTokens ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return asMessage(row);
  }

  async updateSessionProgress(
    sessionId: string,
    turnCount: number,
    progress: number,
  ) {
    await getDb()
      .update(learningSessions)
      .set({ turnCount, progress, updatedAt: nowIso() })
      .where(eq(learningSessions.id, sessionId));
  }

  async reserveGuestTrial(
    guestId: string,
    dateKey: string,
    sessionId: string,
  ) {
    const now = nowIso();
    try {
      await getDb().insert(guestTrialUsage).values({
        id: newId(),
        guestId,
        dateKey,
        sessionId,
        createdAt: now,
        updatedAt: now,
      });
      return true;
    } catch (error) {
      if (String(error).includes("UNIQUE")) return false;
      throw error;
    }
  }

  async createLlmCall(input: {
    id: string;
    sessionId: string;
    userId?: string | null;
    guestId?: string | null;
    providerModel: string;
    reservedFen: number;
  }) {
    const now = nowIso();
    await getDb().insert(llmCallLogs).values({
      id: input.id,
      sessionId: input.sessionId,
      userId: input.userId ?? null,
      guestId: input.guestId ?? null,
      modelAlias: "acad-pro",
      providerModel: input.providerModel,
      status: "reserved",
      reservedFen: input.reservedFen,
      createdAt: now,
      updatedAt: now,
    });
  }

  async finishLlmCall(input: {
    id: string;
    status: "succeeded" | "failed";
    inputTokens: number;
    outputTokens: number;
    actualFen: number;
    errorCode?: string | null;
  }) {
    await getDb()
      .update(llmCallLogs)
      .set({
        status: input.status,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        actualFen: input.actualFen,
        errorCode: input.errorCode ?? null,
        updatedAt: nowIso(),
      })
      .where(eq(llmCallLogs.id, input.id));
  }

  async hasEntitlement(userId: string, nodeSlug: string) {
    const [row] = await getDb()
      .select({ id: nodeEntitlements.id })
      .from(nodeEntitlements)
      .where(
        and(
          eq(nodeEntitlements.userId, userId),
          eq(nodeEntitlements.nodeSlug, nodeSlug),
          eq(nodeEntitlements.status, "active"),
          isNull(nodeEntitlements.deletedAt),
        ),
      )
      .limit(1);
    return Boolean(row);
  }

  async createOrder(input: {
    userId: string;
    nodeSlug: string;
    amountFen: number;
    idempotencyKey: string;
  }) {
    const existing = await getDb()
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.userId, input.userId),
          eq(orders.idempotencyKey, input.idempotencyKey),
          isNull(orders.deletedAt),
        ),
      )
      .limit(1);
    if (existing[0]) return asOrder(existing[0]);
    const now = nowIso();
    const [row] = await getDb()
      .insert(orders)
      .values({
        id: newId(),
        userId: input.userId,
        nodeSlug: input.nodeSlug,
        amountFen: input.amountFen,
        status: "pending",
        idempotencyKey: input.idempotencyKey,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return asOrder(row);
  }

  async getOrder(id: string) {
    const [row] = await getDb()
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), isNull(orders.deletedAt)))
      .limit(1);
    return row ? asOrder(row) : null;
  }

  async getPaidOrderAmount(userId: string, nodeSlug: string) {
    const [row] = await getDb()
      .select({ amountFen: orders.amountFen })
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          eq(orders.nodeSlug, nodeSlug),
          eq(orders.status, "paid"),
          isNull(orders.deletedAt),
        ),
      )
      .orderBy(desc(orders.confirmedAt))
      .limit(1);
    return row?.amountFen ?? 0;
  }

  async confirmTestOrder(id: string, userId: string) {
    const order = await this.getOrder(id);
    if (!order || order.userId !== userId) {
      throw new Error("ORDER_NOT_FOUND");
    }
    if (order.status !== "paid") {
      const now = nowIso();
      await getDb()
        .update(orders)
        .set({ status: "paid", confirmedAt: now, updatedAt: now })
        .where(
          and(
            eq(orders.id, id),
            eq(orders.userId, userId),
            eq(orders.status, "pending"),
          ),
        );
      await getDb()
        .insert(nodeEntitlements)
        .values({
          id: newId(),
          userId,
          nodeSlug: order.nodeSlug,
          sourceOrderId: id,
          status: "active",
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }
    const confirmed = await this.getOrder(id);
    if (!confirmed) throw new Error("ORDER_NOT_FOUND");
    return confirmed;
  }

  async completeLearningSession(
    sessionId: string,
    userId: string,
    note: { title: string; content: string },
  ) {
    const session = await this.getLearningSession(sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("SESSION_NOT_FOUND");
    }
    const existing = await getDb()
      .select()
      .from(learningNotes)
      .where(
        and(
          eq(learningNotes.sessionId, sessionId),
          eq(learningNotes.userId, userId),
          isNull(learningNotes.deletedAt),
        ),
      )
      .limit(1);
    if (existing[0]) return asNote(existing[0]);
    const now = nowIso();
    await getDb()
      .update(learningSessions)
      .set({
        status: "completed",
        progress: 100,
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(learningSessions.id, sessionId));
    const [created] = await getDb()
      .insert(learningNotes)
      .values({
        id: newId(),
        userId,
        sessionId,
        nodeSlug: session.nodeSlug,
        title: note.title,
        content: note.content,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return asNote(created);
  }

  async enrollProgram(userId: string, programSlug: string) {
    const existing = await getDb()
      .select()
      .from(userPrograms)
      .where(
        and(
          eq(userPrograms.userId, userId),
          eq(userPrograms.programSlug, programSlug),
          isNull(userPrograms.deletedAt),
        ),
      )
      .limit(1);
    if (existing[0]) return asProgram(existing[0]);
    const now = nowIso();
    const [created] = await getDb()
      .insert(userPrograms)
      .values({
        id: newId(),
        userId,
        programSlug,
        status: "active",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return asProgram(created);
  }

  async enrollCourse(
    userId: string,
    programSlug: string,
    courseSlug: string,
  ) {
    await this.enrollProgram(userId, programSlug);
    const existing = await getDb()
      .select()
      .from(userCoursePlans)
      .where(
        and(
          eq(userCoursePlans.userId, userId),
          eq(userCoursePlans.courseSlug, courseSlug),
          isNull(userCoursePlans.deletedAt),
        ),
      )
      .limit(1);
    if (existing[0]) return asCoursePlan(existing[0]);
    const now = nowIso();
    const [created] = await getDb()
      .insert(userCoursePlans)
      .values({
        id: newId(),
        userId,
        programSlug,
        courseSlug,
        status: "active",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return asCoursePlan(created);
  }

  async getAcademicPlan(userId: string) {
    const [programRows, courseRows] = await Promise.all([
      getDb()
        .select()
        .from(userPrograms)
        .where(
          and(
            eq(userPrograms.userId, userId),
            isNull(userPrograms.deletedAt),
          ),
        )
        .orderBy(asc(userPrograms.createdAt)),
      getDb()
        .select()
        .from(userCoursePlans)
        .where(
          and(
            eq(userCoursePlans.userId, userId),
            isNull(userCoursePlans.deletedAt),
          ),
        )
        .orderBy(asc(userCoursePlans.createdAt)),
    ]);
    return {
      programs: programRows.map(asProgram),
      courses: courseRows.map(asCoursePlan),
    };
  }

  async listPracticeProjects(userId: string) {
    const rows = await getDb()
      .select()
      .from(practiceProjects)
      .where(
        and(
          eq(practiceProjects.userId, userId),
          isNull(practiceProjects.deletedAt),
        ),
      )
      .orderBy(desc(practiceProjects.updatedAt));
    return rows.map(asPracticeProject);
  }

  async createPracticeProject(input: {
    userId: string;
    title: string;
    context: string;
    goal: string;
  }) {
    const now = nowIso();
    const [created] = await getDb()
      .insert(practiceProjects)
      .values({
        id: newId(),
        userId: input.userId,
        title: input.title.trim(),
        context: input.context.trim(),
        goal: input.goal.trim(),
        status: "active",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return asPracticeProject(created);
  }

  async listAgentThreads(userId: string) {
    const rows = await getDb()
      .select()
      .from(agentThreads)
      .where(
        and(eq(agentThreads.userId, userId), isNull(agentThreads.deletedAt)),
      )
      .orderBy(desc(agentThreads.updatedAt))
      .limit(20);
    return rows.map(asAgentThread);
  }

  async createAgentThread(userId: string, title = "新的思考") {
    const now = nowIso();
    const [created] = await getDb()
      .insert(agentThreads)
      .values({
        id: newId(),
        userId,
        title: title.trim().slice(0, 80) || "新的思考",
        status: "active",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return asAgentThread(created);
  }

  async getAgentThread(id: string) {
    const [row] = await getDb()
      .select()
      .from(agentThreads)
      .where(and(eq(agentThreads.id, id), isNull(agentThreads.deletedAt)))
      .limit(1);
    return row ? asAgentThread(row) : null;
  }

  async listAgentMessages(threadId: string) {
    const rows = await getDb()
      .select()
      .from(agentMessages)
      .where(
        and(
          eq(agentMessages.threadId, threadId),
          isNull(agentMessages.deletedAt),
        ),
      )
      .orderBy(asc(agentMessages.createdAt), asc(agentMessages.id));
    return rows.map(asAgentMessage);
  }

  async findAgentMessageByIdempotency(
    threadId: string,
    role: "user" | "assistant",
    idempotencyKey: string,
  ) {
    const [row] = await getDb()
      .select()
      .from(agentMessages)
      .where(
        and(
          eq(agentMessages.threadId, threadId),
          eq(agentMessages.role, role),
          eq(agentMessages.idempotencyKey, idempotencyKey),
          isNull(agentMessages.deletedAt),
        ),
      )
      .limit(1);
    return row ? asAgentMessage(row) : null;
  }

  async appendAgentMessage(input: {
    threadId: string;
    role: "user" | "assistant";
    content: string;
    idempotencyKey?: string | null;
    inputTokens?: number;
    outputTokens?: number;
  }) {
    const now = nowIso();
    const [created] = await getDb()
      .insert(agentMessages)
      .values({
        id: newId(),
        threadId: input.threadId,
        role: input.role,
        content: input.content,
        idempotencyKey: input.idempotencyKey ?? null,
        inputTokens: input.inputTokens ?? null,
        outputTokens: input.outputTokens ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    await getDb()
      .update(agentThreads)
      .set({ updatedAt: now })
      .where(eq(agentThreads.id, input.threadId));
    return asAgentMessage(created);
  }

  async remember(input: {
    userId: string;
    kind: string;
    contextLabel: string;
    content: string;
    sourceType: string;
    sourceId: string;
    salience?: number;
  }) {
    const now = nowIso();
    const [created] = await getDb()
      .insert(memoryItems)
      .values({
        id: newId(),
        userId: input.userId,
        kind: input.kind,
        contextLabel: input.contextLabel,
        content: input.content.slice(0, 2_000),
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        salience: input.salience ?? 50,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          memoryItems.userId,
          memoryItems.sourceType,
          memoryItems.sourceId,
        ],
        set: {
          content: input.content.slice(0, 2_000),
          contextLabel: input.contextLabel,
          salience: input.salience ?? 50,
          updatedAt: now,
          deletedAt: null,
        },
      })
      .returning();
    return asMemoryItem(created);
  }

  async listMemoryItems(userId: string, limit = 120) {
    const rows = await getDb()
      .select()
      .from(memoryItems)
      .where(
        and(eq(memoryItems.userId, userId), isNull(memoryItems.deletedAt)),
      )
      .orderBy(desc(memoryItems.updatedAt))
      .limit(Math.min(200, Math.max(1, limit)));
    return rows.map(asMemoryItem);
  }

  async forgetMemory(userId: string, id: string) {
    const deletedAt = nowIso();
    const [forgotten] = await getDb()
      .update(memoryItems)
      .set({ deletedAt, updatedAt: deletedAt })
      .where(
        and(
          eq(memoryItems.id, id),
          eq(memoryItems.userId, userId),
          isNull(memoryItems.deletedAt),
        ),
      )
      .returning({ id: memoryItems.id });
    return Boolean(forgotten);
  }

  async recordExamAttempt(input: {
    userId: string;
    sessionId: string;
    nodeSlug: string;
    score: number;
    gradePoint: number;
    creditsAttempted: number;
    creditsEarned: number;
    passed: boolean;
    weakTopics: string[];
  }) {
    const previous = await getDb()
      .select({ id: examAttempts.id })
      .from(examAttempts)
      .where(
        and(
          eq(examAttempts.userId, input.userId),
          eq(examAttempts.sessionId, input.sessionId),
          isNull(examAttempts.deletedAt),
        ),
      );
    const now = nowIso();
    const [created] = await getDb()
      .insert(examAttempts)
      .values({
        id: newId(),
        ...input,
        attemptNumber: previous.length + 1,
        gradePointHundredths: Math.round(input.gradePoint * 100),
        weakTopicsJson: JSON.stringify(input.weakTopics),
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (input.passed) {
      await getDb()
        .update(userCoursePlans)
        .set({ status: "completed", updatedAt: now })
        .where(
          and(
            eq(userCoursePlans.userId, input.userId),
            eq(userCoursePlans.courseSlug, input.nodeSlug),
          ),
        );
    }
    return asExam(created);
  }

  async listExamAttempts(userId: string) {
    const rows = await getDb()
      .select()
      .from(examAttempts)
      .where(
        and(eq(examAttempts.userId, userId), isNull(examAttempts.deletedAt)),
      )
      .orderBy(desc(examAttempts.createdAt));
    return rows.map(asExam);
  }

  async getWallet(userId: string) {
    const [existing] = await getDb()
      .select()
      .from(walletAccounts)
      .where(
        and(
          eq(walletAccounts.userId, userId),
          isNull(walletAccounts.deletedAt),
        ),
      )
      .limit(1);
    if (existing) return asWallet(existing);
    const now = nowIso();
    const [created] = await getDb()
      .insert(walletAccounts)
      .values({
        id: newId(),
        userId,
        balanceFen: 0,
        completedSpendFen: 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return asWallet(created);
  }

  async topUpWallet(userId: string, amountFen: number) {
    const wallet = await this.getWallet(userId);
    const now = nowIso();
    await getDb()
      .update(walletAccounts)
      .set({
        balanceFen: wallet.balanceFen + amountFen,
        updatedAt: now,
      })
      .where(eq(walletAccounts.id, wallet.id));
    await getDb().insert(walletTransactions).values({
      id: newId(),
      userId,
      type: "test_topup",
      amountFen,
      referenceId: null,
      description: "星图学籍卡测试储值（不产生真实资金流）",
      createdAt: now,
      updatedAt: now,
    });
    return this.getWallet(userId);
  }

  async addCompletedCourseSpend(
    userId: string,
    amountFen: number,
    sessionId: string,
  ) {
    const wallet = await this.getWallet(userId);
    const [existing] = await getDb()
      .select({ id: walletTransactions.id })
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.userId, userId),
          eq(walletTransactions.type, "completed_course"),
          eq(walletTransactions.referenceId, sessionId),
          isNull(walletTransactions.deletedAt),
        ),
      )
      .limit(1);
    if (existing) return wallet;
    const now = nowIso();
    await getDb()
      .update(walletAccounts)
      .set({
        completedSpendFen: wallet.completedSpendFen + amountFen,
        updatedAt: now,
      })
      .where(eq(walletAccounts.id, wallet.id));
    await getDb().insert(walletTransactions).values({
      id: newId(),
      userId,
      type: "completed_course",
      amountFen,
      referenceId: sessionId,
      description: "完成课程计入学籍等级",
      createdAt: now,
      updatedAt: now,
    });
    return this.getWallet(userId);
  }

  async getDashboard(userId: string) {
    const [sessionRows, noteRows, entitlementRows] = await Promise.all([
      getDb()
        .select()
        .from(learningSessions)
        .where(
          and(
            eq(learningSessions.userId, userId),
            isNull(learningSessions.deletedAt),
          ),
        )
        .orderBy(desc(learningSessions.updatedAt))
        .limit(6),
      getDb()
        .select()
        .from(learningNotes)
        .where(
          and(
            eq(learningNotes.userId, userId),
            isNull(learningNotes.deletedAt),
          ),
        )
        .orderBy(desc(learningNotes.createdAt))
        .limit(6),
      getDb()
        .select({ nodeSlug: nodeEntitlements.nodeSlug })
        .from(nodeEntitlements)
        .where(
          and(
            eq(nodeEntitlements.userId, userId),
            eq(nodeEntitlements.status, "active"),
            isNull(nodeEntitlements.deletedAt),
          ),
        ),
    ]);
    return {
      sessions: sessionRows.map(asSession),
      notes: noteRows.map(asNote),
      entitlements: entitlementRows.map((row) => row.nodeSlug),
    };
  }
}

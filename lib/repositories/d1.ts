import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import {
  guestTrialUsage,
  learningNotes,
  learningSessions,
  llmCallLogs,
  messages,
  nodeEntitlements,
  orders,
  users,
} from "@/db/schema";
import { newId, nowIso } from "@/lib/server/api";
import type {
  AcademiaRepository,
  LearningSessionRecord,
  MessageRecord,
  NoteRecord,
  OrderRecord,
  UserRecord,
} from "./types";

function asUser(row: typeof users.$inferSelect): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    passwordSalt: row.passwordSalt,
    name: row.name,
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
        name: input.name?.trim() || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return asUser(row);
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

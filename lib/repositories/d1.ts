import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import {
  guestTrialUsage,
  learningSessions,
  llmCallLogs,
  messages,
  users,
} from "@/db/schema";
import { newId, nowIso } from "@/lib/server/api";
import type {
  AcademiaRepository,
  LearningSessionRecord,
  MessageRecord,
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
}

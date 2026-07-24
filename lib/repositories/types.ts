export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  name: string | null;
};

export type LearningSessionRecord = {
  id: string;
  nodeSlug: string;
  userId: string | null;
  guestId: string | null;
  status: string;
  turnCount: number;
  progress: number;
  promptVersion: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MessageRecord = {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  idempotencyKey: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  createdAt: string;
};

export type OrderRecord = {
  id: string;
  userId: string;
  nodeSlug: string;
  amountFen: number;
  status: string;
  idempotencyKey: string;
  confirmedAt: string | null;
  createdAt: string;
};

export type NoteRecord = {
  id: string;
  userId: string;
  sessionId: string;
  nodeSlug: string;
  title: string;
  content: string;
  createdAt: string;
};

export interface AcademiaRepository {
  findUserByEmail(email: string): Promise<UserRecord | null>;
  createUser(input: {
    email: string;
    passwordHash: string;
    passwordSalt: string;
    name?: string;
  }): Promise<UserRecord>;
  claimGuestSessions(guestId: string, userId: string): Promise<void>;
  createLearningSession(input: {
    nodeSlug: string;
    userId?: string | null;
    guestId?: string | null;
  }): Promise<LearningSessionRecord>;
  getLearningSession(id: string): Promise<LearningSessionRecord | null>;
  listMessages(sessionId: string): Promise<MessageRecord[]>;
  findMessageByIdempotency(
    sessionId: string,
    role: "user" | "assistant",
    idempotencyKey: string,
  ): Promise<MessageRecord | null>;
  appendMessage(input: {
    sessionId: string;
    role: "user" | "assistant";
    content: string;
    idempotencyKey?: string | null;
    inputTokens?: number;
    outputTokens?: number;
  }): Promise<MessageRecord>;
  updateSessionProgress(
    sessionId: string,
    turnCount: number,
    progress: number,
  ): Promise<void>;
  reserveGuestTrial(
    guestId: string,
    dateKey: string,
    sessionId: string,
  ): Promise<boolean>;
  createLlmCall(input: {
    id: string;
    sessionId: string;
    userId?: string | null;
    guestId?: string | null;
    providerModel: string;
    reservedFen: number;
  }): Promise<void>;
  finishLlmCall(input: {
    id: string;
    status: "succeeded" | "failed";
    inputTokens: number;
    outputTokens: number;
    actualFen: number;
    errorCode?: string | null;
  }): Promise<void>;
  hasEntitlement(userId: string, nodeSlug: string): Promise<boolean>;
  createOrder(input: {
    userId: string;
    nodeSlug: string;
    amountFen: number;
    idempotencyKey: string;
  }): Promise<OrderRecord>;
  getOrder(id: string): Promise<OrderRecord | null>;
  confirmTestOrder(id: string, userId: string): Promise<OrderRecord>;
  completeLearningSession(
    sessionId: string,
    userId: string,
    note: { title: string; content: string },
  ): Promise<NoteRecord>;
  getDashboard(userId: string): Promise<{
    sessions: LearningSessionRecord[];
    notes: NoteRecord[];
    entitlements: string[];
  }>;
}

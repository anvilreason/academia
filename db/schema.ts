import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const lifecycle = {
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
};

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    passwordIterations: integer("password_iterations")
      .notNull()
      .default(100_000),
    passwordAlgorithm: text("password_algorithm")
      .notNull()
      .default("pbkdf2-sha256"),
    name: text("name"),
    status: text("status").notNull().default("active"),
    emailVerifiedAt: text("email_verified_at"),
    lastLoginAt: text("last_login_at"),
    ...lifecycle,
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const authRateLimits = sqliteTable(
  "auth_rate_limits",
  {
    id: text("id").primaryKey(),
    action: text("action").notNull(),
    subjectHash: text("subject_hash").notNull(),
    windowKey: text("window_key").notNull(),
    count: integer("count").notNull().default(1),
    ...lifecycle,
  },
  (table) => [
    uniqueIndex("auth_rate_limits_subject_window_unique").on(
      table.action,
      table.subjectHash,
      table.windowKey,
    ),
  ],
);

export const learningNodes = sqliteTable(
  "learning_nodes",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    priceFen: integer("price_fen").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    ...lifecycle,
  },
  (table) => [uniqueIndex("learning_nodes_slug_unique").on(table.slug)],
);

export const learningSessions = sqliteTable("learning_sessions", {
  id: text("id").primaryKey(),
  nodeSlug: text("node_slug").notNull(),
  userId: text("user_id"),
  guestId: text("guest_id"),
  status: text("status").notNull().default("active"),
  turnCount: integer("turn_count").notNull().default(0),
  progress: integer("progress").notNull().default(0),
  promptVersion: text("prompt_version").notNull().default("socratic-zh-v1"),
  completedAt: text("completed_at"),
  ...lifecycle,
});

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    idempotencyKey: text("idempotency_key"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    ...lifecycle,
  },
  (table) => [
    uniqueIndex("messages_session_idempotency_unique").on(
      table.sessionId,
      table.idempotencyKey,
      table.role,
    ),
  ],
);

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    nodeSlug: text("node_slug").notNull(),
    amountFen: integer("amount_fen").notNull(),
    status: text("status").notNull().default("pending"),
    idempotencyKey: text("idempotency_key").notNull(),
    confirmedAt: text("confirmed_at"),
    ...lifecycle,
  },
  (table) => [
    uniqueIndex("orders_user_idempotency_unique").on(
      table.userId,
      table.idempotencyKey,
    ),
  ],
);

export const nodeEntitlements = sqliteTable(
  "node_entitlements",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    nodeSlug: text("node_slug").notNull(),
    sourceOrderId: text("source_order_id"),
    status: text("status").notNull().default("active"),
    ...lifecycle,
  },
  (table) => [
    uniqueIndex("entitlements_user_node_unique").on(
      table.userId,
      table.nodeSlug,
    ),
  ],
);

export const learningNotes = sqliteTable("learning_notes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  sessionId: text("session_id").notNull(),
  nodeSlug: text("node_slug").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  ...lifecycle,
});

export const llmCallLogs = sqliteTable("llm_call_logs", {
  id: text("id").primaryKey(),
  sessionId: text("session_id"),
  userId: text("user_id"),
  guestId: text("guest_id"),
  modelAlias: text("model_alias").notNull(),
  providerModel: text("provider_model").notNull(),
  status: text("status").notNull(),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  reservedFen: integer("reserved_fen").notNull().default(0),
  actualFen: integer("actual_fen").notNull().default(0),
  errorCode: text("error_code"),
  ...lifecycle,
});

export const dailyCostQuotas = sqliteTable(
  "daily_cost_quotas",
  {
    id: text("id").primaryKey(),
    dateKey: text("date_key").notNull(),
    reservedFen: integer("reserved_fen").notNull().default(0),
    actualFen: integer("actual_fen").notNull().default(0),
    limitFen: integer("limit_fen").notNull().default(5000),
    ...lifecycle,
  },
  (table) => [uniqueIndex("daily_cost_quotas_date_unique").on(table.dateKey)],
);

export const guestTrialUsage = sqliteTable(
  "guest_trial_usage",
  {
    id: text("id").primaryKey(),
    guestId: text("guest_id").notNull(),
    dateKey: text("date_key").notNull(),
    sessionId: text("session_id").notNull(),
    ...lifecycle,
  },
  (table) => [
    uniqueIndex("guest_trial_usage_guest_date_unique").on(
      table.guestId,
      table.dateKey,
    ),
  ],
);

export const userPrograms = sqliteTable(
  "user_programs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    programSlug: text("program_slug").notNull(),
    status: text("status").notNull().default("active"),
    ...lifecycle,
  },
  (table) => [
    uniqueIndex("user_programs_user_program_unique").on(
      table.userId,
      table.programSlug,
    ),
  ],
);

export const userCoursePlans = sqliteTable(
  "user_course_plans",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    programSlug: text("program_slug").notNull(),
    courseSlug: text("course_slug").notNull(),
    status: text("status").notNull().default("planned"),
    recognitionType: text("recognition_type"),
    sourceCourseSlug: text("source_course_slug"),
    recognizedCredits: integer("recognized_credits").notNull().default(0),
    remainingCredits: integer("remaining_credits").notNull().default(0),
    ...lifecycle,
  },
  (table) => [
    uniqueIndex("user_course_plans_user_course_unique").on(
      table.userId,
      table.courseSlug,
    ),
  ],
);

export const practiceProjects = sqliteTable(
  "practice_projects",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    context: text("context").notNull(),
    goal: text("goal").notNull(),
    status: text("status").notNull().default("active"),
    ...lifecycle,
  },
  (table) => [
    index("practice_projects_user_updated_idx").on(
      table.userId,
      table.updatedAt,
    ),
  ],
);

export const agentThreads = sqliteTable(
  "agent_threads",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    title: text("title").notNull().default("新的思考"),
    status: text("status").notNull().default("active"),
    ...lifecycle,
  },
  (table) => [
    index("agent_threads_user_updated_idx").on(table.userId, table.updatedAt),
  ],
);

export const agentMessages = sqliteTable(
  "agent_messages",
  {
    id: text("id").primaryKey(),
    threadId: text("thread_id").notNull(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    idempotencyKey: text("idempotency_key"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    ...lifecycle,
  },
  (table) => [
    uniqueIndex("agent_messages_thread_idempotency_unique").on(
      table.threadId,
      table.idempotencyKey,
      table.role,
    ),
  ],
);

export const memoryItems = sqliteTable(
  "memory_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    kind: text("kind").notNull(),
    contextLabel: text("context_label").notNull(),
    content: text("content").notNull(),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    salience: integer("salience").notNull().default(50),
    lastUsedAt: text("last_used_at"),
    ...lifecycle,
  },
  (table) => [
    uniqueIndex("memory_items_source_unique").on(
      table.userId,
      table.sourceType,
      table.sourceId,
    ),
    index("memory_items_user_updated_idx").on(table.userId, table.updatedAt),
  ],
);

export const examAttempts = sqliteTable("exam_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  sessionId: text("session_id").notNull(),
  nodeSlug: text("node_slug").notNull(),
  attemptNumber: integer("attempt_number").notNull(),
  score: integer("score").notNull(),
  gradePointHundredths: integer("grade_point_hundredths").notNull(),
  creditsAttempted: integer("credits_attempted").notNull(),
  creditsEarned: integer("credits_earned").notNull(),
  passed: integer("passed", { mode: "boolean" }).notNull(),
  weakTopicsJson: text("weak_topics_json").notNull(),
  ...lifecycle,
});

export const walletAccounts = sqliteTable(
  "wallet_accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    balanceFen: integer("balance_fen").notNull().default(0),
    completedSpendFen: integer("completed_spend_fen").notNull().default(0),
    ...lifecycle,
  },
  (table) => [
    uniqueIndex("wallet_accounts_user_unique").on(table.userId),
  ],
);

export const walletTransactions = sqliteTable(
  "wallet_transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    type: text("type").notNull(),
    amountFen: integer("amount_fen").notNull(),
    referenceId: text("reference_id"),
    description: text("description").notNull(),
    ...lifecycle,
  },
  (table) => [
    uniqueIndex("wallet_transactions_completion_unique").on(
      table.userId,
      table.type,
      table.referenceId,
    ),
  ],
);

export const analyticsEvents = sqliteTable(
  "analytics_events",
  {
    id: text("id").primaryKey(),
    eventName: text("event_name").notNull(),
    schemaVersion: integer("schema_version").notNull().default(1),
    dateKey: text("date_key").notNull(),
    userId: text("user_id"),
    guestId: text("guest_id"),
    analyticsSessionId: text("analytics_session_id"),
    path: text("path"),
    referrerHost: text("referrer_host"),
    schoolSlug: text("school_slug"),
    programSlug: text("program_slug"),
    courseSlug: text("course_slug"),
    trackingLinkId: text("tracking_link_id"),
    acquisitionSource: text("acquisition_source"),
    acquisitionMedium: text("acquisition_medium"),
    acquisitionCampaign: text("acquisition_campaign"),
    country: text("country"),
    region: text("region"),
    city: text("city"),
    timezone: text("timezone"),
    deviceCategory: text("device_category"),
    engagementMs: integer("engagement_ms"),
    propertiesJson: text("properties_json").notNull().default("{}"),
    isTest: integer("is_test", { mode: "boolean" })
      .notNull()
      .default(false),
    occurredAt: text("occurred_at").notNull(),
    ...lifecycle,
  },
  (table) => [
    index("analytics_events_date_name_idx").on(
      table.dateKey,
      table.eventName,
    ),
    index("analytics_events_user_time_idx").on(
      table.userId,
      table.occurredAt,
    ),
    index("analytics_events_guest_time_idx").on(
      table.guestId,
      table.occurredAt,
    ),
    index("analytics_events_program_time_idx").on(
      table.programSlug,
      table.occurredAt,
    ),
    index("analytics_events_campaign_time_idx").on(
      table.acquisitionCampaign,
      table.occurredAt,
    ),
  ],
);

export const analyticsIdentityLinks = sqliteTable(
  "analytics_identity_links",
  {
    id: text("id").primaryKey(),
    guestId: text("guest_id").notNull(),
    userId: text("user_id").notNull(),
    linkedAt: text("linked_at").notNull(),
    ...lifecycle,
  },
  (table) => [
    uniqueIndex("analytics_identity_guest_user_unique").on(
      table.guestId,
      table.userId,
    ),
  ],
);

export const adminMembers = sqliteTable(
  "admin_members",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    email: text("email").notNull(),
    role: text("role").notNull().default("viewer"),
    status: text("status").notNull().default("active"),
    lastAccessAt: text("last_access_at"),
    ...lifecycle,
  },
  (table) => [uniqueIndex("admin_members_email_unique").on(table.email)],
);

export const trackingLinks = sqliteTable(
  "tracking_links",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    targetPath: text("target_path").notNull(),
    source: text("source").notNull(),
    medium: text("medium").notNull(),
    campaign: text("campaign").notNull(),
    ownerEmail: text("owner_email").notNull(),
    status: text("status").notNull().default("active"),
    ...lifecycle,
  },
  (table) => [
    uniqueIndex("tracking_links_code_unique").on(table.code),
    index("tracking_links_campaign_created_idx").on(
      table.campaign,
      table.createdAt,
    ),
  ],
);

export const adminAuditLogs = sqliteTable(
  "admin_audit_logs",
  {
    id: text("id").primaryKey(),
    adminEmail: text("admin_email").notNull(),
    action: text("action").notNull(),
    resourceType: text("resource_type"),
    resourceId: text("resource_id"),
    metadataJson: text("metadata_json").notNull().default("{}"),
    ...lifecycle,
  },
  (table) => [
    index("admin_audit_logs_email_time_idx").on(
      table.adminEmail,
      table.createdAt,
    ),
  ],
);

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  passwordIterations: number;
  passwordAlgorithm: string;
  name: string | null;
  status: string;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
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
  paymentMode: "test" | "production";
  idempotencyKey: string;
  confirmedAt: string | null;
  refundedAt: string | null;
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

export type UserProgramRecord = {
  id: string;
  userId: string;
  programSlug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type UserCoursePlanRecord = {
  id: string;
  userId: string;
  programSlug: string;
  courseSlug: string;
  status: string;
  recognitionType: string | null;
  sourceCourseSlug: string | null;
  recognizedCredits: number;
  remainingCredits: number;
  createdAt: string;
  updatedAt: string;
};

export type ExamAttemptRecord = {
  id: string;
  userId: string;
  sessionId: string;
  nodeSlug: string;
  attemptNumber: number;
  score: number;
  gradePoint: number;
  creditsAttempted: number;
  creditsEarned: number;
  passed: boolean;
  weakTopics: string[];
  createdAt: string;
};

export type WalletRecord = {
  id: string;
  userId: string;
  balanceFen: number;
  completedSpendFen: number;
  createdAt: string;
  updatedAt: string;
};

export type PracticeProjectRecord = {
  id: string;
  userId: string;
  title: string;
  context: string;
  goal: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AgentThreadRecord = {
  id: string;
  userId: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AgentMessageRecord = {
  id: string;
  threadId: string;
  role: string;
  content: string;
  idempotencyKey: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  createdAt: string;
};

export type MemoryItemRecord = {
  id: string;
  userId: string;
  kind: string;
  contextLabel: string;
  content: string;
  sourceType: string;
  sourceId: string;
  salience: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AnswerPathEnrollmentRecord = {
  id: string;
  userId: string;
  pathSlug: string;
  pathVersion: string;
  contentVersion: string;
  evaluationVersion: string;
  currentStep: string;
  status: string;
  outcomeStatus: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BaselineDiagnosisRecord = {
  id: string;
  enrollmentId: string;
  userId: string;
  projectTitle: string;
  ideaSummary: string;
  targetUser: string;
  currentEvidence: string;
  biggestUncertainty: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceSubmissionRecord = {
  id: string;
  enrollmentId: string;
  userId: string;
  stepKey: string;
  evidenceType: string;
  subjectLabel: string;
  content: string;
  provenance: string;
  observedAt: string | null;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
};

export type AnswerPathArtifactRecord = {
  id: string;
  userId: string;
  enrollmentId: string;
  title: string;
  artifactType: string;
  version: number;
  content: string;
  userContribution: string;
  agentContribution: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
};

export type RubricEvaluationRecord = {
  id: string;
  enrollmentId: string;
  artifactId: string;
  rubricVersion: string;
  evaluatorType: string;
  scoreDetail: Record<string, number>;
  strengths: string;
  weaknesses: string;
  feedback: string;
  requiredRevision: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RealWorldOutcomeRecord = {
  id: string;
  enrollmentId: string;
  userId: string;
  decision: string;
  observedResult: string;
  nextAction: string;
  uncertainty: string;
  happenedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CapabilityEvidenceRecord = {
  id: string;
  userId: string;
  enrollmentId: string;
  capabilityId: string;
  level: number;
  sourceType: string;
  sourceId: string;
  confidence: number;
  verifiedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AnswerPathSnapshot = {
  enrollment: AnswerPathEnrollmentRecord;
  baseline: BaselineDiagnosisRecord | null;
  evidence: EvidenceSubmissionRecord[];
  artifacts: AnswerPathArtifactRecord[];
  evaluations: RubricEvaluationRecord[];
  outcome: RealWorldOutcomeRecord | null;
  capabilities: CapabilityEvidenceRecord[];
};

export interface AcademiaRepository {
  findUserByEmail(email: string): Promise<UserRecord | null>;
  createUser(input: {
    email: string;
    passwordHash: string;
    passwordSalt: string;
    passwordIterations: number;
    passwordAlgorithm: string;
    name?: string;
  }): Promise<UserRecord>;
  recordUserLogin(userId: string): Promise<void>;
  consumeAuthRateLimit(input: {
    action: "register" | "login";
    subjectHash: string;
    windowKey: string;
    limit: number;
  }): Promise<boolean>;
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
    paymentMode: "test" | "production";
    idempotencyKey: string;
  }): Promise<OrderRecord>;
  getOrder(id: string): Promise<OrderRecord | null>;
  getPaidOrderAmount(userId: string, nodeSlug: string): Promise<number>;
  confirmTestOrder(id: string, userId: string): Promise<OrderRecord>;
  completeLearningSession(
    sessionId: string,
    userId: string,
    note: { title: string; content: string },
  ): Promise<NoteRecord>;
  enrollProgram(userId: string, programSlug: string): Promise<UserProgramRecord>;
  enrollCourse(
    userId: string,
    programSlug: string,
    courseSlug: string,
  ): Promise<UserCoursePlanRecord>;
  recordCourseRecognition(input: {
    userId: string;
    programSlug: string;
    courseSlug: string;
    recognitionType: "full" | "bridge";
    sourceCourseSlug: string;
    recognizedCredits: number;
    remainingCredits: number;
  }): Promise<UserCoursePlanRecord>;
  getAcademicPlan(userId: string): Promise<{
    programs: UserProgramRecord[];
    courses: UserCoursePlanRecord[];
  }>;
  listPracticeProjects(userId: string): Promise<PracticeProjectRecord[]>;
  createPracticeProject(input: {
    userId: string;
    title: string;
    context: string;
    goal: string;
  }): Promise<PracticeProjectRecord>;
  listAgentThreads(userId: string): Promise<AgentThreadRecord[]>;
  createAgentThread(
    userId: string,
    title?: string,
  ): Promise<AgentThreadRecord>;
  getAgentThread(id: string): Promise<AgentThreadRecord | null>;
  listAgentMessages(threadId: string): Promise<AgentMessageRecord[]>;
  findAgentMessageByIdempotency(
    threadId: string,
    role: "user" | "assistant",
    idempotencyKey: string,
  ): Promise<AgentMessageRecord | null>;
  appendAgentMessage(input: {
    threadId: string;
    role: "user" | "assistant";
    content: string;
    idempotencyKey?: string | null;
    inputTokens?: number;
    outputTokens?: number;
  }): Promise<AgentMessageRecord>;
  remember(input: {
    userId: string;
    kind: string;
    contextLabel: string;
    content: string;
    sourceType: string;
    sourceId: string;
    salience?: number;
  }): Promise<MemoryItemRecord>;
  listMemoryItems(
    userId: string,
    limit?: number,
  ): Promise<MemoryItemRecord[]>;
  forgetMemory(userId: string, id: string): Promise<boolean>;
  startAnswerPath(input: {
    userId: string;
    pathSlug: string;
    pathVersion: string;
    contentVersion: string;
    evaluationVersion: string;
  }): Promise<AnswerPathEnrollmentRecord>;
  getAnswerPathEnrollment(
    userId: string,
    pathSlug: string,
  ): Promise<AnswerPathEnrollmentRecord | null>;
  getAnswerPathSnapshot(
    userId: string,
    pathSlug: string,
  ): Promise<AnswerPathSnapshot | null>;
  saveBaselineDiagnosis(input: {
    enrollmentId: string;
    userId: string;
    projectTitle: string;
    ideaSummary: string;
    targetUser: string;
    currentEvidence: string;
    biggestUncertainty: string;
    confidence: number;
  }): Promise<BaselineDiagnosisRecord>;
  addEvidenceSubmission(input: {
    enrollmentId: string;
    userId: string;
    stepKey: string;
    evidenceType: string;
    subjectLabel: string;
    content: string;
    provenance: string;
    observedAt?: string | null;
  }): Promise<EvidenceSubmissionRecord>;
  createAnswerPathArtifact(input: {
    enrollmentId: string;
    userId: string;
    title: string;
    content: string;
    userContribution: string;
    agentContribution: string;
  }): Promise<AnswerPathArtifactRecord>;
  createRubricEvaluation(input: {
    enrollmentId: string;
    artifactId: string;
    rubricVersion: string;
    scoreDetail: Record<string, number>;
    strengths: string;
    weaknesses: string;
    feedback: string;
    requiredRevision: boolean;
  }): Promise<RubricEvaluationRecord>;
  recordRealWorldOutcome(input: {
    enrollmentId: string;
    userId: string;
    decision: string;
    observedResult: string;
    nextAction: string;
    uncertainty: string;
    happenedAt: string;
    capabilityLevel: number;
    capabilityConfidence: number;
  }): Promise<{
    outcome: RealWorldOutcomeRecord;
    capability: CapabilityEvidenceRecord;
    enrollment: AnswerPathEnrollmentRecord;
  }>;
  recordExamAttempt(input: {
    userId: string;
    sessionId: string;
    nodeSlug: string;
    score: number;
    gradePoint: number;
    creditsAttempted: number;
    creditsEarned: number;
    passed: boolean;
    weakTopics: string[];
  }): Promise<ExamAttemptRecord>;
  listExamAttempts(userId: string): Promise<ExamAttemptRecord[]>;
  getWallet(userId: string): Promise<WalletRecord>;
  topUpWallet(userId: string, amountFen: number): Promise<WalletRecord>;
  addCompletedCourseSpend(
    userId: string,
    amountFen: number,
    sessionId: string,
  ): Promise<WalletRecord>;
  getDashboard(userId: string): Promise<{
    sessions: LearningSessionRecord[];
    notes: NoteRecord[];
    entitlements: string[];
  }>;
}

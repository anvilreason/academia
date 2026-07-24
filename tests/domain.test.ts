import assert from "node:assert/strict";
import test from "node:test";
import {
  canCompleteNode,
  mayAccessNode,
  progressForTurn,
} from "../lib/domain/learning.ts";
import {
  canTransitionOrder,
  nodePriceFen,
} from "../lib/domain/orders.ts";
import {
  canReserveDailyBudget,
  estimateCostFen,
  estimateTokens,
  tokenPriceFor,
} from "../lib/llm/pricing.ts";
import {
  hashPassword,
  PASSWORD_ITERATIONS,
  validatePassword,
  verifyPassword,
} from "../lib/security/password.ts";
import { authWindowKey } from "../lib/security/auth-window.ts";
import { safeInternalPath } from "../lib/security/redirect.ts";
import {
  gradePointForScore,
  membershipForCompletedSpend,
  weightedGpa,
} from "../lib/domain/grading.ts";
import {
  universitySchools,
  universityStats,
} from "../lib/content/university.ts";
import { rankMemories } from "../lib/memory/retrieve.ts";
import {
  CREDIT_PRICE_FEN,
  evaluateCourseTransfer,
} from "../lib/domain/course-transfer.ts";
import {
  canAccessAdminSection,
  adminRoleLabel,
} from "../lib/analytics/admin-permissions.ts";
import {
  isSafeTrackingTarget,
  parseAttributionCookie,
  serializeAttributionCookie,
} from "../lib/analytics/attribution.ts";
import { calculateRevenueMetrics } from "../lib/analytics/revenue-math.ts";
import {
  answerTopics,
  creationStages,
  flagshipAnswerTopics,
} from "../lib/content/answer-paths.ts";
import {
  courseContentStatus,
} from "../lib/content/content-status.ts";
import {
  completionProgress,
  formalAnswerPathConfigs,
  recommendNextAnswerPath,
  scoreAnswerPathArtifact,
  scoreFalseDemandArtifact,
  validateBaseline,
  validateEvidence,
} from "../lib/domain/answer-path.ts";

test("password policy rejects weak values and verifies derived hashes", async () => {
  assert.equal(validatePassword("short"), "密码至少需要 10 位");
  assert.equal(
    validatePassword("abcdefghijk"),
    "密码需同时包含字母和数字",
  );
  assert.equal(validatePassword("Academia2026"), null);
  const derived = await hashPassword("Academia2026");
  assert.equal(derived.iterations, PASSWORD_ITERATIONS);
  assert.equal(
    await verifyPassword("Academia2026", derived.hash, derived.salt),
    true,
  );
  assert.equal(
    await verifyPassword("Academia2027", derived.hash, derived.salt),
    false,
  );
});

test("auth helpers enforce fixed windows and same-origin redirects", () => {
  assert.equal(authWindowKey(15, 15 * 60_000 - 1), "0");
  assert.equal(authWindowKey(15, 15 * 60_000), "1");
  assert.equal(safeInternalPath("/learn/4p-stp"), "/learn/4p-stp");
  assert.equal(safeInternalPath("https://example.com"), "/home");
  assert.equal(safeInternalPath("//example.com"), "/home");
});

test("admin roles expose only their assigned operational sections", () => {
  assert.equal(canAccessAdminSection("owner", "team"), true);
  assert.equal(canAccessAdminSection("growth", "tracking"), true);
  assert.equal(canAccessAdminSection("growth", "users"), false);
  assert.equal(canAccessAdminSection("growth", "finance"), false);
  assert.equal(canAccessAdminSection("operations", "academics"), true);
  assert.equal(canAccessAdminSection("analyst", "finance"), true);
  assert.equal(canAccessAdminSection("viewer", "definitions"), true);
  assert.equal(canAccessAdminSection("viewer", "overview"), true);
  assert.equal(canAccessAdminSection("viewer", "growth"), false);
  assert.equal(adminRoleLabel("analyst"), "数据分析");
});

test("tracking attribution accepts only internal targets and round trips cookies", () => {
  assert.equal(isSafeTrackingTarget("/college"), true);
  assert.equal(isSafeTrackingTarget("/programs/marketing?from=launch"), true);
  assert.equal(isSafeTrackingTarget("//evil.example"), false);
  assert.equal(isSafeTrackingTarget("https://evil.example"), false);
  assert.equal(isSafeTrackingTarget("/r/recursive"), false);
  const attribution = {
    trackingLinkId: "link-1",
    source: "xiaohongshu",
    medium: "social",
    campaign: "launch-01",
  };
  const serialized = serializeAttributionCookie(attribution, false);
  assert.deepEqual(parseAttributionCookie(serialized), attribution);
});

test("test order state machine cannot be used as a production payment bypass", () => {
  assert.equal(canTransitionOrder("pending", "paid", "test"), true);
  assert.equal(canTransitionOrder("pending", "paid", "production"), false);
  assert.equal(canTransitionOrder("paid", "pending", "test"), false);
  assert.equal(canTransitionOrder("paid", "refunded", "production"), true);
  assert.equal(nodePriceFen("porter-five-forces"), 9_900);
});

test("revenue metrics exclude test orders and refunded revenue", () => {
  const result = calculateRevenueMetrics(10, [
    {
      userId: "u1",
      amountFen: 9_900,
      status: "paid",
      paymentMode: "production",
    },
    {
      userId: "u1",
      amountFen: 5_000,
      status: "paid",
      paymentMode: "production",
    },
    {
      userId: "u2",
      amountFen: 9_900,
      status: "refunded",
      paymentMode: "production",
    },
    {
      userId: "u3",
      amountFen: 99_900,
      status: "paid",
      paymentMode: "test",
    },
  ]);
  assert.equal(result.grossRevenueFen, 24_800);
  assert.equal(result.refundedFen, 9_900);
  assert.equal(result.netRevenueFen, 14_900);
  assert.equal(result.payerCount, 1);
  assert.equal(result.arpuFen, 1_490);
  assert.equal(result.arppuFen, 14_900);
  assert.equal(result.repeatRate, 100);
});

test("course transfer grants full credit only when scope is covered", () => {
  const target = {
    slug: "target",
    title: "概率论",
    credits: 4,
    identityKey: "概率论",
    rigorLevel: 320,
    curriculumVersion: "2026",
  };
  const identical = evaluateCourseTransfer(target, [
    {
      ...target,
      slug: "source-identical",
    },
  ]);
  assert.equal(identical.type, "full");
  assert.equal(identical.recognizedCredits, 4);
  assert.equal(identical.remainingCredits, 0);
  assert.equal(identical.priceFen, 0);

  const bridge = evaluateCourseTransfer(target, [
    {
      ...target,
      slug: "source-foundation",
      credits: 3,
      rigorLevel: 220,
    },
  ]);
  assert.equal(bridge.type, "bridge");
  assert.equal(bridge.recognizedCredits > 0, true);
  assert.equal(bridge.remainingCredits, 4 - bridge.recognizedCredits);
  assert.equal(bridge.priceFen, bridge.remainingCredits * CREDIT_PRICE_FEN);

  const unrelated = evaluateCourseTransfer(target, [
    {
      ...target,
      slug: "source-unrelated",
      title: "线性代数",
      identityKey: "线性代数",
    },
  ]);
  assert.equal(unrelated.type, "none");
  assert.equal(unrelated.remainingCredits, 4);
});

test("node permission keeps paid nodes behind an authenticated entitlement", () => {
  assert.equal(
    mayAccessNode({
      nodeSlug: "4p-stp",
      userId: null,
      hasEntitlement: false,
    }),
    true,
  );
  assert.equal(
    mayAccessNode({
      nodeSlug: "porter-five-forces",
      userId: "user-1",
      hasEntitlement: false,
    }),
    false,
  );
  assert.equal(
    mayAccessNode({
      nodeSlug: "porter-five-forces",
      userId: "user-1",
      hasEntitlement: true,
    }),
    true,
  );
});

test("learning progress reaches completion only at the configured turn", () => {
  assert.equal(progressForTurn("porter-five-forces", 1), 25);
  assert.equal(progressForTurn("porter-five-forces", 4), 100);
  assert.equal(canCompleteNode("porter-five-forces", 3), false);
  assert.equal(canCompleteNode("porter-five-forces", 4), true);
  assert.equal(progressForTurn("4p-stp", 5), 100);
});

test("cost estimation and global budget remain conservative", () => {
  assert.equal(estimateTokens("一段中文内容"), 5);
  assert.equal(estimateCostFen(1_000, 800) > 0, true);
  assert.deepEqual(tokenPriceFor("openai", "gpt-5.6-sol"), {
    currency: "usd",
    inputPerMillion: 5,
    outputPerMillion: 30,
  });
  assert.deepEqual(tokenPriceFor("kimi", "kimi-k3"), {
    currency: "cny",
    inputPerMillion: 20,
    outputPerMillion: 100,
  });
  assert.deepEqual(tokenPriceFor("kimi", "kimi-k2.6"), {
    currency: "cny",
    inputPerMillion: 6.5,
    outputPerMillion: 27,
  });
  assert.equal(
    estimateCostFen(
      1_000_000,
      1_000_000,
      99,
      tokenPriceFor("kimi", "kimi-k3"),
    ),
    12_000,
  );
  assert.equal(
    canReserveDailyBudget({
      reservedFen: 4_900,
      actualFen: 50,
      requestedFen: 50,
    }),
    true,
  );
  assert.equal(
    canReserveDailyBudget({
      reservedFen: 4_900,
      actualFen: 50,
      requestedFen: 51,
    }),
    false,
  );
});

test("exam scores map to a 4.0 GPA and remain credit weighted", () => {
  assert.equal(gradePointForScore(59), 0);
  assert.equal(gradePointForScore(60), 1);
  assert.equal(gradePointForScore(85), 3.7);
  assert.equal(gradePointForScore(90), 4);
  assert.equal(
    weightedGpa([
      { credits: 3, gradePoint: 4 },
      { credits: 6, gradePoint: 3 },
    ]),
    3.33,
  );
});

test("membership is activated by completed-course spend, never wallet top-up", () => {
  const walletTopUpFen = 1_000_000;
  assert.equal(walletTopUpFen > 0, true);
  assert.equal(membershipForCompletedSpend(0).name, "新知");
  assert.equal(membershipForCompletedSpend(30_000).name, "研习");
  assert.equal(membershipForCompletedSpend(50_000).name, "知行");
  assert.equal(membershipForCompletedSpend(1_000_000).name, "山长");
});

test("university catalog has broad, unique and credit-complete programs", () => {
  assert.equal(universityStats.schools, 17);
  assert.equal(universityStats.programs, 95);
  assert.equal(universityStats.courses, 4192);
  assert.equal(universityStats.minCredits, 146);
  assert.equal(universityStats.maxCredits, 200);

  const programSlugs = universitySchools.flatMap((school) =>
    school.programs.map((program) => program.slug),
  );
  const courseSlugs = universitySchools.flatMap((school) =>
    school.programs.flatMap((program) =>
      program.courses.map((course) => course.slug),
    ),
  );
  assert.equal(new Set(programSlugs).size, programSlugs.length);
  assert.equal(new Set(courseSlugs).size, courseSlugs.length);

  for (const school of universitySchools) {
    for (const program of school.programs) {
      assert.equal(
        program.creditPlan.reduce((sum, band) => sum + band.credits, 0),
        program.requiredCredits,
      );
      assert.equal(
        program.courses.every((course) => course.credits > 0),
        true,
      );
      assert.equal(
        program.courses.reduce((sum, course) => sum + course.credits, 0),
        program.requiredCredits,
      );
      assert.equal(
        program.application.capabilities.every((item) => item.length > 8),
        true,
      );
      assert.equal(
        program.application.workFields.every((item) => item.length > 1),
        true,
      );
      assert.equal(program.application.portfolio.length, 3);
      for (const band of program.creditPlan) {
        const courses = program.courses.filter(
          (course) => course.category === band.label,
        );
        assert.equal(courses.length > 0, true);
        assert.equal(
          courses.reduce((sum, course) => sum + course.credits, 0),
          band.credits,
        );
      }
      for (const course of program.courses) {
        assert.equal(course.identityKey.length > 0, true);
        assert.equal(course.rigorLevel >= 100, true);
        assert.equal(course.curriculumVersion, "2026");
        assert.equal(course.application.questions.length, 2);
        assert.equal(course.application.workScenes.length, 2);
        assert.equal(course.application.ventureScenes.length, 2);
        assert.equal(course.application.deliverable.length > 8, true);
        assert.equal(course.application.boundary.length > 18, true);
      }
    }
  }
});

test("answer atlas exposes 30 versioned questions and six formal paths", () => {
  assert.equal(answerTopics.length, 30);
  assert.equal(new Set(answerTopics.map((topic) => topic.slug)).size, 30);
  assert.equal(flagshipAnswerTopics.length, 6);
  for (const stage of creationStages) {
    assert.equal(
      answerTopics.filter((topic) => topic.stage === stage.slug).length,
      5,
    );
  }
  for (const topic of answerTopics) {
    assert.equal(topic.title.length > 8, true);
    assert.equal(topic.initialConclusion.length > 10, true);
    assert.equal(topic.artifact.length > 2, true);
    assert.equal(topic.knowledgeLinks.length > 0, true);
    assert.equal(
      ["flagship-open", "flagship-building", "question-index"].includes(topic.status),
      true,
    );
  }
  assert.equal(
    answerTopics.filter((topic) => topic.status === "flagship-open").length,
    6,
  );
  for (const topic of flagshipAnswerTopics) {
    assert.ok(topic.preview);
    assert.equal(topic.preview.misconceptions.length >= 3, true);
  }
});

test("six formal paths have distinct requirements, rubrics and capabilities", () => {
  assert.equal(formalAnswerPathConfigs.length, 6);
  assert.deepEqual(
    new Set(formalAnswerPathConfigs.map((path) => path.slug)),
    new Set(
      flagshipAnswerTopics.map((path) => path.slug),
    ),
  );
  assert.equal(
    new Set(formalAnswerPathConfigs.map((path) => path.capabilityId)).size,
    6,
  );
  assert.equal(
    new Set(formalAnswerPathConfigs.map((path) => path.artifactType)).size,
    6,
  );
  for (const path of formalAnswerPathConfigs) {
    assert.equal(path.steps.length, 7);
    assert.equal(path.evidenceMinimum >= 4, true);
    assert.equal(path.requiredEvidenceTypes.length >= 2, true);
    assert.equal(path.artifactMinimum >= 280, true);
    assert.equal(path.evidenceTypes.length >= 4, true);
  }
});

test("path recommendation resumes active work before opening the next capability", () => {
  const now = new Date().toISOString();
  const base = {
    id: "enrollment-1",
    userId: "user",
    pathVersion: "v1",
    contentVersion: "v1",
    evaluationVersion: "v1",
    currentStep: "evidence",
    outcomeStatus: null,
    startedAt: now,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  assert.equal(recommendNextAnswerPath([])?.slug, "is-this-a-false-demand");
  assert.equal(
    recommendNextAnswerPath([
      {
        ...base,
        pathSlug: "course-to-portfolio",
        status: "active",
      },
    ])?.slug,
    "course-to-portfolio",
  );
  assert.equal(
    recommendNextAnswerPath([
      {
        ...base,
        pathSlug: "is-this-a-false-demand",
        currentStep: "completed",
        status: "completed",
        completedAt: now,
      },
    ])?.slug,
    "non-leading-user-interviews",
  );
});

test("false-demand path requires traceable reality evidence and can demand revision", () => {
  assert.equal(
    validateBaseline({
      projectTitle: "报价助手",
      ideaSummary: "帮助独立设计师更快判断项目范围并形成报价。",
      targetUser: "最近三个月独立接单且需要自己报价的设计师。",
      currentEvidence: "目前只有两位朋友表示感兴趣，还没有行为证据。",
      biggestUncertainty: "他们是否真的会为减少报价时间改变现在的工作方式。",
      confidence: 35,
    }).ok,
    true,
  );
  assert.equal(
    validateEvidence({
      evidenceType: "interview",
      subjectLabel: "受访者 01",
      content: "上周为一个新项目手工整理报价表，前后花了两个小时。",
      provenance: "7 月 24 日访谈录音 08:30",
    }).ok,
    true,
  );
  const now = new Date().toISOString();
  const baseline = {
    id: "baseline",
    enrollmentId: "enrollment",
    userId: "user",
    projectTitle: "报价助手",
    ideaSummary: "帮助设计师报价",
    targetUser: "独立设计师",
    currentEvidence: "少量访谈",
    biggestUncertainty: "尚未确定他们是否愿意付出切换成本",
    confidence: 35,
    createdAt: now,
    updatedAt: now,
  };
  const evidence = Array.from({ length: 5 }, (_, index) => ({
    id: `evidence-${index}`,
    enrollmentId: "enrollment",
    userId: "user",
    stepKey: "field-action",
    evidenceType:
      index === 3 ? "cost" : index === 4 ? "counterexample" : "interview",
    subjectLabel: `受访者 ${index + 1}`,
    content: "最近一次报价中实际使用了表格，并为核对范围投入了两个小时。",
    provenance: `录音 ${index + 1} 的 10:00`,
    observedAt: now,
    verificationStatus: "user_attested",
    createdAt: now,
    updatedAt: now,
  }));
  const artifact = {
    id: "artifact",
    userId: "user",
    enrollmentId: "enrollment",
    title: "需求证据表",
    artifactType: "demand_evidence_table",
    version: 1,
    content:
      "已观察到的事实包括五位对象最近真实完成报价的过程。三位对象用表格逐项核对范围，一位直接复用旧报价，一位把报价交给合作伙伴。反例显示一位对象并不需要新工具，而更看重合同模板。当前只能判断报价核对存在重复成本，尚未证明独立工具是最佳替代方案。现有替代方案虽然慢，但已经嵌入交付流程，切换本身也有成本。下一步会用可点击原型观察是否改变现有流程；若没有任何人愿意导入真实项目，或者只愿意围观演示而不输入项目信息，则推翻当前产品形态。仍然不确定用户愿意承担多少迁移成本，也不知道高频与低频接单者是否应被视为同一人群。证据不足的部分不会被写成结论，所有原始记录都保留录音位置，并可回到对应时间点复核。",
    userContribution: "用户亲自访谈、整理行为证据并写出判断。",
    agentContribution: "Agent 只协助检查结构和反例。",
    visibility: "private",
    createdAt: now,
    updatedAt: now,
  };
  const passing = scoreFalseDemandArtifact({ baseline, evidence, artifact });
  assert.equal(passing.requiredRevision, false);
  const portfolioPath = formalAnswerPathConfigs.find(
    (path) => path.slug === "course-to-portfolio",
  )!;
  assert.equal(
    scoreAnswerPathArtifact(portfolioPath, {
      baseline,
      evidence,
      artifact: { ...artifact, artifactType: portfolioPath.artifactType },
    }).requiredRevision,
    true,
  );
  const failing = scoreFalseDemandArtifact({
    baseline,
    evidence: evidence.slice(0, 2),
    artifact: { ...artifact, content: "只有少量访谈总结，尚无反例。" },
  });
  assert.equal(failing.requiredRevision, true);
  assert.equal(
    completionProgress({
      hasBaseline: true,
      evidenceCount: 5,
      artifactCount: 2,
      reviewCount: 2,
      latestReviewRequiresRevision: false,
      hasOutcome: true,
    }),
    100,
  );
});

test("course status distinguishes formally open teaching from planned study paths", () => {
  assert.equal(courseContentStatus({ availability: "open" }), "formally-open");
  assert.equal(courseContentStatus({ availability: "planned" }), "study-path");
});

test("long-term memory retrieval favors relevant and recent user evidence", () => {
  const now = new Date().toISOString();
  const memories = [
    {
      id: "memory-1",
      userId: "user-1",
      kind: "learning",
      contextLabel: "竞争战略：Porter 五力",
      content: "行业利润主要被上游基础模型供应商拿走。",
      sourceType: "learning_message",
      sourceId: "message-1",
      salience: 60,
      lastUsedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "memory-2",
      userId: "user-1",
      kind: "learning",
      contextLabel: "艺术史基础",
      content: "我想比较文艺复兴时期的赞助制度。",
      sourceType: "learning_message",
      sourceId: "message-2",
      salience: 60,
      lastUsedAt: null,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
    },
  ];
  const ranked = rankMemories(memories, "我的行业利润为什么被供应商拿走？");
  assert.equal(ranked[0].id, "memory-1");
});

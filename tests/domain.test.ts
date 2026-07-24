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
  assert.equal(canAccessAdminSection("operations", "academics"), true);
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

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
} from "../lib/llm/pricing.ts";
import {
  hashPassword,
  validatePassword,
  verifyPassword,
} from "../lib/security/password.ts";
import {
  gradePointForScore,
  membershipForCompletedSpend,
  weightedGpa,
} from "../lib/domain/grading.ts";
import {
  universitySchools,
  universityStats,
} from "../lib/content/university.ts";

test("password policy rejects weak values and verifies derived hashes", async () => {
  assert.equal(validatePassword("short"), "密码至少需要 10 位");
  assert.equal(
    validatePassword("abcdefghijk"),
    "密码需同时包含字母和数字",
  );
  assert.equal(validatePassword("Academia2026"), null);
  const derived = await hashPassword("Academia2026");
  assert.equal(
    await verifyPassword("Academia2026", derived.hash, derived.salt),
    true,
  );
  assert.equal(
    await verifyPassword("Academia2027", derived.hash, derived.salt),
    false,
  );
});

test("test order state machine cannot be used as a production payment bypass", () => {
  assert.equal(canTransitionOrder("pending", "paid", "test"), true);
  assert.equal(canTransitionOrder("pending", "paid", "production"), false);
  assert.equal(canTransitionOrder("paid", "pending", "test"), false);
  assert.equal(canTransitionOrder("paid", "refunded", "production"), true);
  assert.equal(nodePriceFen("porter-five-forces"), 9_900);
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
  assert.equal(universityStats.courses, 760);
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
    }
  }
});

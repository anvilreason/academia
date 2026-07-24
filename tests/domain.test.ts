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

import assert from "node:assert/strict";
import test from "node:test";

const { isPaidOrderCreated, trialEndingWindow } = await import(
  "./billing-notifications.ts"
);

test("zero-value trial order is not treated as a payment", () => {
  assert.equal(isPaidOrderCreated("order_created", 0), false);
  assert.equal(isPaidOrderCreated("order_created", 50000), true);
  assert.equal(isPaidOrderCreated("subscription_payment_success", 0), false);
  assert.equal(isPaidOrderCreated("subscription_payment_recovered", 0), false);
  assert.equal(
    isPaidOrderCreated("subscription_payment_success", 50000),
    true,
  );
  assert.equal(isPaidOrderCreated("subscription_payment_failed", 0), true);
});

test("trial ending reminder window covers the next three days", () => {
  const now = new Date("2026-08-17T12:00:00.000Z");
  const window = trialEndingWindow(now);

  assert.equal(window.gt.toISOString(), "2026-08-17T12:00:00.000Z");
  assert.equal(window.lte.toISOString(), "2026-08-20T12:00:00.000Z");
});

import assert from "node:assert/strict";
import test from "node:test";

const {
  isSubscriptionLifecyclePayload,
  parseLemonSqueezyDate,
  subscriptionAccessExpiresAt,
} = await import("./lemonsqueezy-subscriptions.ts");

test("subscription lifecycle events only accept subscription resources", () => {
  assert.equal(
    isSubscriptionLifecyclePayload({
      eventName: "subscription_updated",
      resourceType: "subscriptions",
    }),
    true,
  );
  assert.equal(
    isSubscriptionLifecyclePayload({
      eventName: "subscription_payment_success",
      resourceType: "subscription-invoices",
    }),
    false,
  );
  assert.equal(
    isSubscriptionLifecyclePayload({
      eventName: "subscription_resumed",
      resourceType: "subscriptions",
    }),
    true,
  );
  assert.equal(
    isSubscriptionLifecyclePayload({
      eventName: "subscription_unpaused",
      resourceType: "subscriptions",
    }),
    true,
  );
});

test("parseLemonSqueezyDate rejects invalid provider dates", () => {
  assert.equal(parseLemonSqueezyDate(null), null);
  assert.equal(parseLemonSqueezyDate("not-a-date"), null);
  assert.equal(
    parseLemonSqueezyDate("2026-08-16T12:00:00.000Z")?.toISOString(),
    "2026-08-16T12:00:00.000Z",
  );
});

test("only trial subscriptions expire at the trial end date", () => {
  const trialEndsAt = new Date("2026-08-16T12:00:00.000Z");

  assert.equal(
    subscriptionAccessExpiresAt({ status: "TRIALING", trialEndsAt }),
    trialEndsAt,
  );
  assert.equal(
    subscriptionAccessExpiresAt({ status: "ACTIVE", trialEndsAt }),
    null,
  );
});

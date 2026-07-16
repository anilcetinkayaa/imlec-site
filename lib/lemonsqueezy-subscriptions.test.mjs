import assert from "node:assert/strict";
import test from "node:test";

const { isSubscriptionLifecyclePayload, parseLemonSqueezyDate } = await import(
  "./lemonsqueezy-subscriptions.ts"
);

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
});

test("parseLemonSqueezyDate rejects invalid provider dates", () => {
  assert.equal(parseLemonSqueezyDate(null), null);
  assert.equal(parseLemonSqueezyDate("not-a-date"), null);
  assert.equal(
    parseLemonSqueezyDate("2026-08-16T12:00:00.000Z")?.toISOString(),
    "2026-08-16T12:00:00.000Z",
  );
});

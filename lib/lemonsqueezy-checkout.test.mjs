import assert from "node:assert/strict";
import test from "node:test";

const { buildLemonSqueezyCheckoutUrl } = await import(
  "./lemonsqueezy-checkout.ts"
);

test("buildLemonSqueezyCheckoutUrl appends user custom data", () => {
  const url = new URL(
    buildLemonSqueezyCheckoutUrl({
      checkoutUrl: "https://example.lemonsqueezy.com/checkout/buy/test",
      email: "user@example.com",
      userId: "user_123",
      productSlug: "fis260",
    }),
  );

  assert.equal(url.searchParams.get("checkout[email]"), "user@example.com");
  assert.equal(url.searchParams.get("checkout[custom][user_id]"), "user_123");
  assert.equal(url.searchParams.get("checkout[custom][product_slug]"), "fis260");
});

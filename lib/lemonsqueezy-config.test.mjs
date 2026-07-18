import assert from "node:assert/strict";
import test from "node:test";

const { getLemonSqueezyMode } = await import("./lemonsqueezy-config.ts");

test("Lemon Squeezy mode remains test unless live is explicitly selected", () => {
  const previous = process.env.LEMONSQUEEZY_MODE;

  delete process.env.LEMONSQUEEZY_MODE;
  assert.equal(getLemonSqueezyMode(), "test");

  process.env.LEMONSQUEEZY_MODE = "test";
  assert.equal(getLemonSqueezyMode(), "test");

  process.env.LEMONSQUEEZY_MODE = "live";
  assert.equal(getLemonSqueezyMode(), "live");

  if (previous === undefined) {
    delete process.env.LEMONSQUEEZY_MODE;
  } else {
    process.env.LEMONSQUEEZY_MODE = previous;
  }
});

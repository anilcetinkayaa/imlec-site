import assert from "node:assert/strict";
import test from "node:test";

const { staleDesktopSessionWhere } = await import("./desktop-session-policy.ts");

test("new login only revokes stale sessions on the same device", () => {
  const where = staleDesktopSessionWhere({
    userId: "user-1",
    productId: "product-1",
    deviceId: "device-2",
    currentTokenHash: "new-token",
  });

  assert.equal(where.deviceId, "device-2");
  assert.equal(where.userId, "user-1");
  assert.deepEqual(where.NOT, { tokenHash: "new-token" });
});

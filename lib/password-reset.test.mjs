import assert from "node:assert/strict";
import test from "node:test";
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  passwordResetExpiresAt,
} from "../src/server/auth/password-reset.ts";

test("password reset tokens are random and hash deterministically", () => {
  const first = createPasswordResetToken();
  const second = createPasswordResetToken();

  assert.notEqual(first, second);
  assert.equal(hashPasswordResetToken(first), hashPasswordResetToken(first));
  assert.notEqual(hashPasswordResetToken(first), first);
});

test("password reset token expires after 30 minutes", () => {
  const now = new Date("2026-07-02T09:00:00.000Z");
  assert.equal(
    passwordResetExpiresAt(now).toISOString(),
    "2026-07-02T09:30:00.000Z",
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  EMAIL_VERIFICATION_TTL_HOURS,
  createEmailVerificationToken,
  emailVerificationExpiresAt,
  hashEmailVerificationToken,
} from "../src/server/auth/email-verification-token.ts";

test("email verification tokens are random and hash deterministically", () => {
  const first = createEmailVerificationToken();
  const second = createEmailVerificationToken();

  assert.notEqual(first, second);
  assert.equal(hashEmailVerificationToken(first), hashEmailVerificationToken(first));
  assert.notEqual(hashEmailVerificationToken(first), first);
});

test("email verification token expires after configured duration", () => {
  const now = new Date("2026-08-17T12:00:00.000Z");
  const expiresAt = emailVerificationExpiresAt(now);

  assert.equal(
    expiresAt.getTime() - now.getTime(),
    EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000,
  );
});

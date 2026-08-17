import { createHash, randomBytes } from "node:crypto";

export const EMAIL_VERIFICATION_TTL_HOURS = 24;

export function createEmailVerificationToken() {
  return randomBytes(32).toString("base64url");
}

export function hashEmailVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function emailVerificationExpiresAt(now = new Date()) {
  return new Date(now.getTime() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000);
}

import { createHash, randomBytes } from "node:crypto";

export const PASSWORD_RESET_TTL_MINUTES = 30;

export function createPasswordResetToken() {
  return randomBytes(32).toString("base64url");
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function passwordResetExpiresAt(now = new Date()) {
  return new Date(now.getTime() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
}

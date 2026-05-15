import { createHash, randomBytes } from "node:crypto";
import * as OTPAuth from "otpauth";
import { decryptString, encryptString } from "./crypto";

export const TOTP_ISSUER = "İmleç Yazılım";
const BASE32_SECRET_PATTERN = /^[A-Z2-7]+=*$/;

export function createTotpSecret() {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function isValidTotpSecret(secret: string) {
  if (!BASE32_SECRET_PATTERN.test(secret)) {
    return false;
  }

  try {
    OTPAuth.Secret.fromBase32(secret);
    return true;
  } catch {
    return false;
  }
}

function createSecretFromBase32(secret: string) {
  if (!isValidTotpSecret(secret)) {
    throw new Error("INVALID_TOTP_SECRET");
  }

  return OTPAuth.Secret.fromBase32(secret);
}

export function createTotpUri({
  email,
  secret,
}: {
  email: string;
  secret: string;
}) {
  const totp = new OTPAuth.TOTP({
    issuer: TOTP_ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: createSecretFromBase32(secret),
  });

  return totp.toString();
}

export function validateTotpToken({
  encryptedSecret,
  token,
}: {
  encryptedSecret: string;
  token: string;
}) {
  const secret = decryptString(encryptedSecret);
  const totp = new OTPAuth.TOTP({
    issuer: TOTP_ISSUER,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: createSecretFromBase32(secret),
  });

  return totp.validate({ token, window: 2 }) !== null;
}

export function encryptTotpSecret(secret: string) {
  return encryptString(secret);
}

export function decryptTotpSecret(encryptedSecret: string) {
  return decryptString(encryptedSecret);
}

export function createRecoveryCodes() {
  return Array.from({ length: 10 }, () => {
    const raw = randomBytes(4).toString("hex").toUpperCase();

    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
  });
}

export function hashRecoveryCode(code: string) {
  return createHash("sha256")
    .update(code.trim().toUpperCase())
    .digest("hex");
}

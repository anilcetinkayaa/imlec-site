import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");

const { decryptString, encryptString } = await import("./crypto.ts");

test("encryptString and decryptString round-trip text", () => {
  const encrypted = encryptString("imlec-secret");

  assert.notEqual(encrypted, "imlec-secret");
  assert.equal(decryptString(encrypted), "imlec-secret");
});

test("decryptString rejects tampered payload", () => {
  const encrypted = encryptString("imlec-secret");
  const tampered = `${encrypted.slice(0, -2)}AA`;

  assert.throws(() => decryptString(tampered));
});

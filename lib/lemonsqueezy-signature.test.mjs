import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

const { verifyLemonSqueezySignature } = await import(
  "./lemonsqueezy-signature.ts"
);

test("verifyLemonSqueezySignature accepts matching X-Signature", () => {
  const rawBody = JSON.stringify({ ok: true });
  const secret = "webhook-secret";
  const signature = createHmac("sha256", secret).update(rawBody).digest("hex");

  assert.equal(
    verifyLemonSqueezySignature({ rawBody, signature, secret }),
    true,
  );
});

test("verifyLemonSqueezySignature rejects mismatched X-Signature", () => {
  assert.equal(
    verifyLemonSqueezySignature({
      rawBody: JSON.stringify({ ok: true }),
      signature: "00",
      secret: "webhook-secret",
    }),
    false,
  );
});

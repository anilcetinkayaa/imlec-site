import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyLemonSqueezySignature({
  rawBody,
  signature,
  secret,
}: {
  rawBody: string;
  signature: string | null;
  secret: string;
}) {
  if (!signature) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

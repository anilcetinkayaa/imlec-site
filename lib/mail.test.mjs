import assert from "node:assert/strict";
import test from "node:test";
import React from "react";

delete process.env.RESEND_API_KEY;
delete process.env.MAIL_FROM;

const { getMailFromAddress, isMailConfigured, sendMail } = await import(
  "./mail.ts"
);

test("getMailFromAddress returns default brand sender", () => {
  assert.equal(
    getMailFromAddress(),
    "İmleç Yazılım <noreply@imlecyazilim.com>",
  );
});

test("sendMail skips safely when RESEND_API_KEY is missing", async () => {
  const result = await sendMail({
    to: "test@example.com",
    subject: "Test",
    react: React.createElement("div", null, "Test"),
  });

  assert.equal(result.skipped, true);
  assert.equal(result.reason, "RESEND_API_KEY_MISSING");
  assert.equal(isMailConfigured(), false);
});

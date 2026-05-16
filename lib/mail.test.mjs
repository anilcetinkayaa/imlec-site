import assert from "node:assert/strict";
import test from "node:test";
import React from "react";

delete process.env.RESEND_API_KEY;
delete process.env.EMAIL_FROM;
delete process.env.MAIL_FROM;

const { getMailFromAddress, isMailConfigured, sendMail } = await import(
  "./mail.ts"
);

test("getMailFromAddress returns default brand sender", () => {
  assert.equal(
    getMailFromAddress(),
    "İmleç Yazılım <bildirim@imlecyazilim.com>",
  );
});

test("getMailFromAddress prefers EMAIL_FROM over MAIL_FROM", () => {
  process.env.EMAIL_FROM = "İmleç Yazılım <bildirim@imlecyazilim.com>";
  process.env.MAIL_FROM = "İmleç Yazılım <eski@imlecyazilim.com>";

  assert.equal(
    getMailFromAddress(),
    "İmleç Yazılım <bildirim@imlecyazilim.com>",
  );

  delete process.env.EMAIL_FROM;
  delete process.env.MAIL_FROM;
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

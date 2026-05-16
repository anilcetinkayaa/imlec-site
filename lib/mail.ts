import type { ReactElement } from "react";
import { Resend } from "resend";

export type SendMailInput = {
  to: string | string[];
  subject: string;
  react: ReactElement;
};

export function getMailFromAddress() {
  return (
    process.env.EMAIL_FROM ??
    process.env.MAIL_FROM ??
    "İmleç Yazılım <bildirim@imlecyazilim.com>"
  );
}

export function isMailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendMail({ to, subject, react }: SendMailInput) {
  if (!isMailConfigured()) {
    return {
      skipped: true,
      reason: "RESEND_API_KEY_MISSING",
    } as const;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from: getMailFromAddress(),
    to,
    subject,
    react,
  });

  return {
    skipped: false,
    result,
  } as const;
}

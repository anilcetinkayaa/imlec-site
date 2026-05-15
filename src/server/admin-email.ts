import { createElement } from "react";
import { AdminAlertEmail } from "@/emails/AdminAlertEmail";
import { sendMail } from "@/lib/mail";

export async function sendAdminActionAlert({
  action,
  target,
}: {
  action: string;
  target: string;
}) {
  const to = process.env.ADMIN_ALERT_EMAIL;

  if (!to) {
    return;
  }

  try {
    await sendMail({
      to,
      subject: `Admin işlem bildirimi: ${action}`,
      react: createElement(AdminAlertEmail, {
        action,
        target,
      }),
    });
  } catch (error) {
    console.error("[ADMIN ALERT EMAIL ERROR]", error);
  }
}

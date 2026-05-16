import { createElement } from "react";
import { AccessRequestApprovedEmail } from "@/emails/AccessRequestApprovedEmail";
import { AdminAccessRequestEmail } from "@/emails/AdminAccessRequestEmail";
import { sendMail } from "@/lib/mail";

export async function sendAccessRequestNotification({
  email,
  productName,
  requestedAt,
}: {
  email: string;
  productName: string;
  requestedAt: Date;
}) {
  const to = process.env.ADMIN_ALERT_EMAIL;

  if (!to) {
    return;
  }

  try {
    await sendMail({
      to,
      subject: `Yeni erişim talebi: ${productName}`,
      react: createElement(AdminAccessRequestEmail, {
        email,
        productName,
        requestedAt: new Intl.DateTimeFormat("tr-TR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(requestedAt),
      }),
    });
  } catch (error) {
    console.error("[ACCESS REQUEST ADMIN EMAIL ERROR]", error);
  }
}

export async function sendAccessApprovedEmail({
  email,
  productName,
}: {
  email: string;
  productName: string;
}) {
  try {
    await sendMail({
      to: email,
      subject: `${productName} erişiminiz aktif edildi`,
      react: createElement(AccessRequestApprovedEmail, {
        productName,
      }),
    });
  } catch (error) {
    console.error("[ACCESS REQUEST APPROVED EMAIL ERROR]", error);
  }
}

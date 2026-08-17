import { createElement } from "react";
import { VerifyEmail } from "@/emails/VerifyEmail";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/src/db/prisma";
import {
  createEmailVerificationToken,
  emailVerificationExpiresAt,
  hashEmailVerificationToken,
} from "@/src/server/auth/email-verification-token";

export async function sendEmailVerification({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const token = createEmailVerificationToken();
  const tokenHash = hashEmailVerificationToken(token);
  const record = await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: emailVerificationExpiresAt(),
    },
    select: { id: true },
  });

  const appUrl =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    "https://imlecyazilim.com";
  const verificationUrl = new URL("/verify-email", appUrl);
  verificationUrl.searchParams.set("token", token);

  try {
    const mail = await sendMail({
      to: email,
      subject: "İmleç Yazılım e-posta doğrulama bağlantısı",
      react: createElement(VerifyEmail, {
        verificationUrl: verificationUrl.toString(),
      }),
    });

    if (mail.skipped || mail.result.error) {
      await prisma.emailVerificationToken.delete({ where: { id: record.id } });
      console.error("[EMAIL VERIFICATION ERROR] Mail gönderilemedi.");
      return false;
    }

    await prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null, NOT: { id: record.id } },
      data: { usedAt: new Date() },
    });

    return true;
  } catch (error) {
    await prisma.emailVerificationToken.delete({ where: { id: record.id } });
    console.error("[EMAIL VERIFICATION ERROR]", error);
    return false;
  }
}

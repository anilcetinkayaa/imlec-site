"use server";

import { createElement } from "react";
import { redirect } from "next/navigation";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/src/db/prisma";
import { hashEmailVerificationToken } from "@/src/server/auth/email-verification-token";

export async function verifyEmailAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();

  if (!token) {
    redirect("/verify-email?status=invalid");
  }

  const now = new Date();
  const tokenHash = hashEmailVerificationToken(token);
  const verifiedUser = await prisma.$transaction(async (tx) => {
    const record = await tx.emailVerificationToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        user: { select: { email: true, name: true, emailVerifiedAt: true } },
      },
    });

    if (!record || record.usedAt || record.expiresAt <= now) {
      return null;
    }

    const claimed = await tx.emailVerificationToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });

    if (claimed.count !== 1) {
      return null;
    }

    if (!record.user.emailVerifiedAt) {
      await tx.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: now },
      });
    }

    return record.user;
  });

  if (!verifiedUser) {
    redirect("/verify-email?status=invalid");
  }

  try {
    await sendMail({
      to: verifiedUser.email,
      subject: "İmleç Yazılım hesabınız hazır",
      react: createElement(WelcomeEmail, { name: verifiedUser.name }),
    });
  } catch (error) {
    console.error("[WELCOME EMAIL ERROR]", error);
  }

  redirect("/login?verified=1");
}

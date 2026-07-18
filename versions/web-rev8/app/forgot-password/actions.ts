"use server";

import { createElement } from "react";
import { redirect } from "next/navigation";
import { ResetPassword } from "@/emails/ResetPassword";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/src/db/prisma";
import { normalizeEmail } from "@/src/server/auth/password";
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  passwordResetExpiresAt,
} from "@/src/server/auth/password-reset";

const REQUEST_WINDOW_MINUTES = 15;
const MAX_REQUESTS_PER_WINDOW = 3;

export async function requestPasswordReset(formData: FormData) {
  const emailValue = formData.get("email");
  const email =
    typeof emailValue === "string" ? normalizeEmail(emailValue) : "";

  if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, disabledAt: true },
    });

    if (user && !user.disabledAt) {
      const requestWindowStart = new Date(
        Date.now() - REQUEST_WINDOW_MINUTES * 60 * 1000,
      );
      const recentRequests = await prisma.passwordResetToken.count({
        where: {
          userId: user.id,
          createdAt: { gte: requestWindowStart },
        },
      });

      if (recentRequests < MAX_REQUESTS_PER_WINDOW) {
        const token = createPasswordResetToken();
        const tokenHash = hashPasswordResetToken(token);
        const resetRecord = await prisma.$transaction(async (tx) => {
          await tx.passwordResetToken.updateMany({
            where: { userId: user.id, usedAt: null },
            data: { usedAt: new Date() },
          });

          return tx.passwordResetToken.create({
            data: {
              userId: user.id,
              tokenHash,
              expiresAt: passwordResetExpiresAt(),
            },
            select: { id: true },
          });
        });

        const appUrl =
          process.env.AUTH_URL ??
          process.env.NEXTAUTH_URL ??
          "https://imlecyazilim.com";
        const resetUrl = new URL("/reset-password", appUrl);
        resetUrl.searchParams.set("token", token);

        try {
          const mail = await sendMail({
            to: user.email,
            subject: "İmleç Yazılım şifre sıfırlama bağlantısı",
            react: createElement(ResetPassword, {
              resetUrl: resetUrl.toString(),
            }),
          });

          if (mail.skipped || mail.result.error) {
            await prisma.passwordResetToken.delete({
              where: { id: resetRecord.id },
            });
            console.error("[PASSWORD RESET EMAIL ERROR] Mail gönderilemedi.");
          }
        } catch (error) {
          await prisma.passwordResetToken.delete({
            where: { id: resetRecord.id },
          });
          console.error("[PASSWORD RESET EMAIL ERROR]", error);
        }
      }
    }
  }

  redirect("/forgot-password?sent=1");
}

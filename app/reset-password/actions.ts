"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/src/db/prisma";
import { hashPassword } from "@/src/server/auth/password";
import { hashPasswordResetToken } from "@/src/server/auth/password-reset";

export async function resetPassword(formData: FormData) {
  const tokenValue = formData.get("token");
  const passwordValue = formData.get("password");
  const confirmPasswordValue = formData.get("confirmPassword");
  const token = typeof tokenValue === "string" ? tokenValue : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const confirmPassword =
    typeof confirmPasswordValue === "string" ? confirmPasswordValue : "";

  if (
    !token ||
    password.length < 8 ||
    password.length > 128 ||
    password !== confirmPassword
  ) {
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=input`);
  }

  const tokenHash = hashPasswordResetToken(token);
  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
      user: { select: { disabledAt: true } },
    },
  });

  if (
    !resetRecord ||
    resetRecord.usedAt ||
    resetRecord.expiresAt <= new Date() ||
    resetRecord.user.disabledAt
  ) {
    redirect("/reset-password?error=invalid");
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();

  const consumed = await prisma.$transaction(async (tx) => {
    const result = await tx.passwordResetToken.updateMany({
      where: {
        id: resetRecord.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });

    if (result.count !== 1) {
      return false;
    }

    await tx.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    });
    await tx.session.updateMany({
      where: { userId: resetRecord.userId, revokedAt: null },
      data: { revokedAt: now },
    });
    await tx.passwordResetToken.updateMany({
      where: { userId: resetRecord.userId, usedAt: null },
      data: { usedAt: now },
    });

    return true;
  });

  if (!consumed) {
    redirect("/reset-password?error=invalid");
  }

  redirect("/login?reset=1");
}

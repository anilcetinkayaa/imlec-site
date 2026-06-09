"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/src/db/prisma";
import { hashPassword, verifyPassword } from "@/src/server/auth/password";

export async function changeOwnPassword(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/security");
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8 || newPassword !== confirmPassword) {
    redirect("/account/security?password=invalid");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    redirect("/account/security?password=invalid");
  }

  const currentMatches = await verifyPassword(currentPassword, user.passwordHash);

  if (!currentMatches) {
    redirect("/account/security?password=wrong");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      passwordHash: await hashPassword(newPassword),
    },
  });

  redirect("/account/security?password=changed");
}

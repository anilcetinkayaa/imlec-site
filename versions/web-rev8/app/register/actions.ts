"use server";

import { redirect } from "next/navigation";
import { createElement } from "react";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/src/db/prisma";
import { hashPassword, normalizeEmail } from "@/src/server/auth/password";

export async function registerAction(formData: FormData) {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const nameValue = formData.get("name");

  const email =
    typeof emailValue === "string" ? normalizeEmail(emailValue) : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const name =
    typeof nameValue === "string" && nameValue.trim()
      ? nameValue.trim()
      : null;

  if (!email || password.length < 8) {
    redirect("/register?error=invalid-input");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    redirect("/register?error=email-exists");
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
    },
  });

  try {
    await sendMail({
      to: user.email,
      subject: "İmleç Yazılım hesabınız oluşturuldu",
      react: createElement(WelcomeEmail, { name: user.name }),
    });
  } catch (error) {
    console.error("[WELCOME EMAIL ERROR]", error);
  }

  redirect("/login?registered=1");
}

"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

export async function loginAction(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl");
  const redirectTo = typeof callbackUrl === "string" ? callbackUrl : "/account";

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=invalid-credentials");
    }

    throw error;
  }

  redirect(redirectTo);
}

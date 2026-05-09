"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

function getSafeCallbackUrl(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "/account";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/account";
  }

  if (value.startsWith("/login")) {
    return "/account";
  }

  return value;
}

function isFailedSignInUrl(value: string) {
  const url = new URL(value, "https://imlecyazilim.com");

  return (
    url.searchParams.has("error") ||
    url.pathname === "/login" ||
    url.pathname === "/api/auth/callback/credentials"
  );
}

export async function loginAction(formData: FormData) {
  const redirectTo = getSafeCallbackUrl(formData.get("callbackUrl"));
  let signInResult: string | undefined;

  try {
    signInResult = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=invalid-credentials");
    }

    throw error;
  }

  if (!signInResult || isFailedSignInUrl(signInResult)) {
    redirect("/login?error=invalid-credentials");
  }

  redirect(redirectTo);
}

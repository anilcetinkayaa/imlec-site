"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

function isNextRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

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

export async function loginAction(formData: FormData) {
  const redirectTo = getSafeCallbackUrl(formData.get("callbackUrl"));

  try {
    console.log("[AUTH DEBUG] signIn redirectTo:", redirectTo);

    const signInResult = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo,
    });

    console.log("[AUTH DEBUG] signIn result:", signInResult);
    console.log("[AUTH DEBUG] returned URL:", signInResult);

    const session = await auth();
    console.log("[AUTH DEBUG] session exists after login:", !!session?.user);
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuthError) {
      console.log("[AUTH DEBUG] signIn AuthError:", error.type);
      redirect("/login?error=invalid-credentials");
    }

    throw error;
  }
}

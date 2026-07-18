"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginActionResult = {
  success: boolean;
  error?: string;
};

export async function loginAction(
  formData: FormData,
): Promise<LoginActionResult> {
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    const returnedUrl =
      typeof signInResult === "string"
        ? signInResult
        : typeof signInResult === "object" &&
            signInResult !== null &&
            "url" in signInResult &&
            typeof signInResult.url === "string"
          ? signInResult.url
          : null;

    console.log("[AUTH DEBUG] signIn result:", signInResult);
    console.log("[AUTH DEBUG] returned URL:", returnedUrl);

    if (returnedUrl) {
      const url = new URL(returnedUrl, "https://imlecyazilim.com");

      if (url.searchParams.has("error")) {
        return { success: false, error: "Email veya şifre hatalı." };
      }
    }

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      console.log("[AUTH DEBUG] signIn AuthError:", error.type);
      return { success: false, error: "Email veya şifre hatalı." };
    }

    console.error("[AUTH DEBUG] unexpected signIn error:", error);
    return {
      success: false,
      error: "Giriş sırasında beklenmeyen bir hata oluştu.",
    };
  }
}

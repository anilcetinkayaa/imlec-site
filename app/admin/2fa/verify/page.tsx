import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/src/server/admin";
import { Verify2FAForm } from "./verify-2fa-form";

export const metadata: Metadata = {
  title: "Admin 2FA Doğrulama | İmleç Yazılım",
};

export default async function Admin2FAVerifyPage() {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/2fa/verify");
  }

  if (admin.status === "forbidden") {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-12 text-zinc-100">
      <section className="mx-auto max-w-xl rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-blue-300">
          Admin 2FA
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Doğrulama kodunu girin.
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Microsoft Authenticator uygulamasındaki 6 haneli kodu kullanın.
        </p>
        <Verify2FAForm />
      </section>
    </main>
  );
}

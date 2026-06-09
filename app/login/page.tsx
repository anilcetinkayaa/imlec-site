import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Giris | Imlec Yazilim",
  description: "Imlec Yazilim platform hesabiniza giris yapin.",
};

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
    registered?: string;
  }>;
};

function getSafeCallbackUrl(value?: string) {
  if (!value) {
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

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = getSafeCallbackUrl(params.callbackUrl);
  const isAdminLogin = callbackUrl.startsWith("/admin");

  return (
    <main className="min-h-screen overflow-hidden bg-[#08090b] text-zinc-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.12),transparent_58%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-xl flex-col px-6 py-7 sm:px-8">
        <nav className="flex items-center justify-between border-b border-white/[0.08] pb-6">
          <Link
            href="/"
            className="text-[15px] font-semibold tracking-tight text-white"
          >
            Imlec Yazilim
          </Link>
          <Link
            href="/register"
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            Kayit ol
          </Link>
        </nav>

        <section className="flex flex-1 items-center py-16">
          <div className="w-full rounded-xl border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-blue-300/75">
              {isAdminLogin ? "Yonetim hesabi" : "Platform hesabi"}
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              {isAdminLogin ? "Admin kanalina giris" : "Giris yap"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {isAdminLogin
                ? "Yonetim paneline erismek icin size tanimlanan yetkili hesapla giris yapin."
                : "Web uyelik paneline erismek icin platform hesabinizla giris yapin."}
            </p>

            <LoginForm
              callbackUrl={callbackUrl}
              initialError={
                params.error ? "Email veya sifre hatali." : undefined
              }
              registered={Boolean(params.registered)}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

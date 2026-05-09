import type { Metadata } from "next";
import Link from "next/link";
import { registerAction } from "./actions";

export const metadata: Metadata = {
  title: "Kayıt Ol | İmleç Yazılım",
  description: "İmleç Yazılım platform hesabı oluşturun.",
};

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen overflow-hidden bg-[#08090b] text-zinc-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.12),transparent_58%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-xl flex-col px-6 py-7 sm:px-8">
        <nav className="flex items-center justify-between border-b border-white/[0.08] pb-6">
          <Link
            href="/"
            className="text-[15px] font-semibold tracking-tight text-white"
          >
            İmleç Yazılım
          </Link>
          <Link
            href="/login"
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            Giriş yap
          </Link>
        </nav>

        <section className="flex flex-1 items-center py-16">
          <div className="w-full rounded-xl border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-blue-300/75">
              Platform hesabı
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Hesap oluştur
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Tek hesapla web üyelik paneline ve ileride desteklenecek masaüstü
              uygulamalara giriş yapılır.
            </p>

            {params.error === "email-exists" ? (
              <p className="mt-5 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                Bu email ile kayıtlı bir hesap var.
              </p>
            ) : null}

            {params.error === "invalid-input" ? (
              <p className="mt-5 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                Email zorunlu, şifre en az 8 karakter olmalı.
              </p>
            ) : null}

            <form action={registerAction} className="mt-7 grid gap-4">
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-400">Ad soyad</span>
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-300/50"
                  placeholder="Ahmet Yılmaz"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="text-zinc-400">Email</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-300/50"
                  placeholder="demo@imlecyazilim.com"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="text-zinc-400">Şifre</span>
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-300/50"
                  placeholder="En az 8 karakter"
                />
              </label>

              <button className="mt-2 inline-flex h-11 items-center justify-center rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-950 transition hover:bg-white">
                Kayıt ol
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { resetPassword } from "./actions";

export const metadata: Metadata = {
  title: "Yeni Şifre | İmleç Yazılım",
  description: "İmleç Yazılım hesabınız için yeni şifre belirleyin.",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token, error } = await searchParams;
  const invalidLink = !token || error === "invalid";

  return (
    <main className="min-h-screen overflow-hidden bg-[#08090b] text-zinc-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.12),transparent_58%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-xl flex-col px-6 py-7 sm:px-8">
        <nav className="flex items-center justify-between border-b border-white/[0.08] pb-6">
          <Link href="/" className="text-[15px] font-semibold text-white">
            İmleç Yazılım
          </Link>
          <Link href="/login" className="text-sm text-zinc-400 transition hover:text-white">
            Giriş yap
          </Link>
        </nav>

        <section className="flex flex-1 items-center py-16">
          <div className="w-full rounded-xl border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-blue-300/75">
              Hesap güvenliği
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Yeni şifre belirleyin
            </h1>

            {invalidLink ? (
              <div className="mt-6">
                <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-4 text-sm leading-6 text-red-200">
                  Bu bağlantı geçersiz, süresi dolmuş veya daha önce kullanılmış.
                </p>
                <Link href="/forgot-password" className="mt-5 inline-flex text-sm text-blue-300 transition hover:text-blue-200">
                  Yeni bağlantı iste
                </Link>
              </div>
            ) : (
              <>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  En az 8 karakterden oluşan yeni şifrenizi girin.
                </p>
                {error === "input" ? (
                  <p className="mt-5 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                    Şifreler eşleşmeli ve en az 8 karakter olmalıdır.
                  </p>
                ) : null}
                <form action={resetPassword} className="mt-7 grid gap-4">
                  <input type="hidden" name="token" value={token} />
                  <label className="grid gap-2 text-sm">
                    <span className="text-zinc-400">Yeni şifre</span>
                    <input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-white outline-none transition focus:border-blue-300/50" />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="text-zinc-400">Yeni şifreyi tekrar girin</span>
                    <input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-white outline-none transition focus:border-blue-300/50" />
                  </label>
                  <button className="mt-2 inline-flex h-11 items-center justify-center rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-950 transition hover:bg-white">
                    Şifreyi güncelle
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

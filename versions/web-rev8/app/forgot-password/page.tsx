import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "./actions";

export const metadata: Metadata = {
  title: "Şifremi Unuttum | İmleç Yazılım",
  description: "İmleç Yazılım hesabınız için şifre sıfırlama bağlantısı alın.",
};

type ForgotPasswordPageProps = {
  searchParams: Promise<{ sent?: string }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const { sent } = await searchParams;

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
              Şifrenizi sıfırlayın
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Hesabınıza bağlı e-posta adresini girin. Geçerli bağlantı 30 dakika kullanılabilir.
            </p>

            {sent === "1" ? (
              <div className="mt-6 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-sm leading-6 text-emerald-200">
                Bu e-posta ile kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderildi. Gelen kutusu ve spam klasörünü kontrol edin.
              </div>
            ) : (
              <form action={requestPasswordReset} className="mt-7 grid gap-4">
                <label className="grid gap-2 text-sm">
                  <span className="text-zinc-400">E-posta</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-300/50"
                    placeholder="E-posta adresi"
                  />
                </label>
                <button className="mt-2 inline-flex h-11 items-center justify-center rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-950 transition hover:bg-white">
                  Sıfırlama bağlantısı gönder
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

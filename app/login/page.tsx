import type { Metadata } from "next";
import Link from "next/link";
import { loginAction } from "./actions";

export const metadata: Metadata = {
  title: "Giriş | İmleç Yazılım",
  description: "İmleç Yazılım platform hesabınıza giriş yapın.",
};

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
    registered?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/account";

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
            href="/register"
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            Kayıt ol
          </Link>
        </nav>

        <section className="flex flex-1 items-center py-16">
          <div className="w-full rounded-xl border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-blue-300/75">
              Platform hesabı
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Giriş yap
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Web üyelik paneline erişmek için platform hesabınızla giriş yapın.
            </p>

            {params.registered ? (
              <p className="mt-5 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                Kayıt oluşturuldu. Şimdi giriş yapabilirsiniz.
              </p>
            ) : null}

            {params.error ? (
              <p className="mt-5 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                Email veya şifre hatalı.
              </p>
            ) : null}

            <form action={loginAction} className="mt-7 grid gap-4">
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
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
                  autoComplete="current-password"
                  required
                  className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-300/50"
                  placeholder="••••••••"
                />
              </label>

              <button className="mt-2 inline-flex h-11 items-center justify-center rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-950 transition hover:bg-white">
                Giriş yap
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

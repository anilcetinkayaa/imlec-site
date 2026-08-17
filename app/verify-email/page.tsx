import type { Metadata } from "next";
import Link from "next/link";
import { verifyEmailAction } from "./actions";

export const metadata: Metadata = {
  title: "E-posta Doğrulama | İmleç Yazılım",
  description: "İmleç Yazılım hesabınızın e-posta adresini doğrulayın.",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; status?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim();
  const invalid = params.status === "invalid" || !token;

  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-16 text-zinc-100">
      <section className="mx-auto max-w-lg rounded-xl border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-blue-300/75">
          Hesap güvenliği
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
          E-posta doğrulama
        </h1>

        {invalid ? (
          <>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Bu doğrulama bağlantısı geçersiz, kullanılmış veya süresi dolmuş.
              Üyelik sayfasından yeni bağlantı isteyebilirsiniz.
            </p>
            <Link
              href="/uyelik"
              className="mt-7 inline-flex h-11 items-center justify-center rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-950"
            >
              Üyelik sayfasına git
            </Link>
          </>
        ) : (
          <>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Hesabınızdaki e-posta adresini doğrulamak için aşağıdaki düğmeye
              basın.
            </p>
            <form action={verifyEmailAction} className="mt-7">
              <input name="token" type="hidden" value={token} />
              <button className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-500 px-5 text-sm font-medium text-white transition hover:bg-blue-400">
                E-posta adresimi doğrula
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

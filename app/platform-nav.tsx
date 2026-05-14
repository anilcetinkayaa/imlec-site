import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { logoutAction } from "./account/actions";

type PlatformNavProps = {
  compact?: boolean;
};

export async function PlatformNav({ compact = false }: PlatformNavProps) {
  const session = await auth();
  const userInitial =
    session?.user?.name?.charAt(0) ?? session?.user?.email?.charAt(0) ?? "İ";

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#08090b]/88 backdrop-blur-xl">
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10 ${
          compact ? "h-16" : "h-20"
        }`}
      >
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/[0.1] bg-[#050608] shadow-[0_0_24px_rgba(59,130,246,0.14)]">
            <Image
              src="/imlec-icon.png"
              alt=""
              width={88}
              height={88}
              priority
              className="h-10 w-10 object-contain"
            />
          </span>
          <span className="min-w-0 leading-none">
            <span className="block truncate text-[15px] font-semibold tracking-tight text-white">
              İmleç Yazılım
            </span>
            <span className="mt-1 hidden text-[11px] text-zinc-500 sm:block">
              Masaüstü yazılım platformu
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
          <Link href="/#products" className="transition hover:text-white">
            Ürünler
          </Link>
          <Link href="/#updates" className="transition hover:text-white">
            Güncellemeler
          </Link>
          <Link href="/fis260#uyelikler" className="transition hover:text-white">
            Üyelikler
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/api/downloads/fis260"
            className="hidden h-10 items-center justify-center rounded-lg border border-blue-400/25 bg-blue-400/10 px-4 text-sm font-medium text-blue-100 transition hover:border-blue-300/40 hover:bg-blue-400/15 lg:inline-flex"
          >
            Windows için indir
          </Link>

          {session?.user ? (
            <div className="group relative pb-3 pt-3">
              <button className="flex h-10 items-center gap-3 rounded-lg border border-white/[0.12] bg-white/[0.035] pl-2 pr-3 text-sm text-zinc-200 transition group-hover:border-white/[0.22] group-hover:bg-white/[0.06]">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-blue-400/15 font-mono text-[11px] uppercase text-blue-200">
                  {userInitial}
                </span>
                <span className="hidden max-w-36 truncate sm:block">
                  {session.user.name ?? session.user.email}
                </span>
              </button>
              <div className="invisible absolute right-0 top-[calc(100%-0.5rem)] w-56 rounded-xl border border-white/[0.1] bg-[#101216] p-2 opacity-0 shadow-[0_24px_70px_rgba(0,0,0,0.42)] transition duration-150 group-hover:visible group-hover:opacity-100">
                <Link
                  href="/account"
                  className="block rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Hesabım
                </Link>
                <Link
                  href="/account#products"
                  className="block rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Ürünlerim
                </Link>
                <Link
                  href="/account#devices"
                  className="block rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Cihazlar
                </Link>
                <Link
                  href="/account#payments"
                  className="block rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Ödemeler
                </Link>
                <form
                  action={logoutAction}
                  className="mt-1 border-t border-white/[0.08] pt-1"
                >
                  <button className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-500 transition hover:bg-white/[0.05] hover:text-white">
                    Çıkış
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm text-zinc-400 transition hover:text-white sm:block"
              >
                Giriş
              </Link>
              <Link
                href="/register"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-100 px-4 text-sm font-medium text-zinc-950 transition hover:bg-white"
              >
                Hesap oluştur
              </Link>
            </>
          )}

          <details className="group relative md:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-sm text-zinc-300 transition hover:bg-white/[0.06] [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Menü</span>
              <span aria-hidden="true" className="text-lg leading-none">
                ≡
              </span>
            </summary>
            <div className="absolute right-0 top-12 w-52 rounded-xl border border-white/[0.1] bg-[#101216] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
              <Link
                href="/#products"
                className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.05] hover:text-white"
              >
                Ürünler
              </Link>
              <Link
                href="/#updates"
                className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.05] hover:text-white"
              >
                Güncellemeler
              </Link>
              <Link
                href="/api/downloads/fis260"
                className="block rounded-lg px-3 py-2 text-sm text-blue-200 hover:bg-blue-400/10"
              >
                Windows için indir
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

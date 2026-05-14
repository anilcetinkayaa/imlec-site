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
    session?.user?.name?.charAt(0) ?? session?.user?.email?.charAt(0) ?? "I";

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#08090b]/85 backdrop-blur-xl">
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10 ${
          compact ? "h-16" : "h-20"
        }`}
      >
        <Link href="/" className="flex items-center gap-3">
          <span className="relative grid h-11 w-11 overflow-hidden rounded-xl border border-white/[0.1] bg-[#101216] shadow-[0_0_28px_rgba(59,130,246,0.16)]">
            <Image
              src="/imleç yazılım logo.png"
              alt=""
              fill
              sizes="44px"
              className="scale-[2.7] object-cover object-center opacity-95"
            />
          </span>
          <span className="leading-none">
            <span className="block text-[15px] font-semibold tracking-tight text-white">
              İmleç Yazılım
            </span>
            <span className="mt-1 hidden text-[11px] text-zinc-500 sm:block">
              Desktop software platformu
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
          <Link href="/fis260#pricing" className="transition hover:text-white">
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <div className="group relative">
              <button className="flex h-10 items-center gap-3 rounded-lg border border-white/[0.1] bg-white/[0.03] pl-2 pr-3 text-sm text-zinc-200 transition hover:border-white/[0.18] hover:bg-white/[0.06]">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-blue-400/15 font-mono text-[11px] uppercase text-blue-200">
                  {userInitial}
                </span>
                <span className="hidden max-w-32 truncate sm:block">
                  {session.user.name ?? session.user.email}
                </span>
              </button>
              <div className="invisible absolute right-0 top-12 w-56 rounded-xl border border-white/[0.1] bg-[#101216] p-2 opacity-0 shadow-[0_24px_70px_rgba(0,0,0,0.42)] transition group-hover:visible group-hover:opacity-100">
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
                <form action={logoutAction} className="mt-1 border-t border-white/[0.08] pt-1">
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
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-100 px-4 text-sm font-medium text-zinc-950 transition hover:bg-white"
              >
                Hesap oluştur
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

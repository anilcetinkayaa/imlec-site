import Image from "next/image";
import Link from "next/link";
import { Download } from "lucide-react";
import { auth } from "@/auth";
import { logoutAction } from "@/app/account/actions";
import { Button } from "@/components/ui/Button";
import { MobileSiteMenu } from "@/components/marketing/MobileSiteMenu";

type SiteHeaderProps = {
  compact?: boolean;
  rev9Aligned?: boolean;
};

const navItems = [
  { href: "/#products", label: "Ürünler" },
  { href: "/uyelik", label: "Abone ol" },
];

export async function SiteHeader({
  compact = false,
  rev9Aligned = false,
}: SiteHeaderProps) {
  const session = await auth();
  const userInitial =
    session?.user?.name?.charAt(0) ?? session?.user?.email?.charAt(0) ?? "İ";

  return (
    <header
      className={
        rev9Aligned
          ? "sticky top-[33px] z-40 border-b border-[var(--border-subtle)] bg-[oklch(0.14_0.005_250/0.72)] backdrop-blur-[18px]"
          : "sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--surface-0)]/82 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--surface-0)]/72"
      }
    >
      <div
        className={`mx-auto flex items-center justify-between ${
          rev9Aligned
            ? "h-16 max-w-[1240px] px-[14px] md:h-[70px] md:px-8"
            : "max-w-7xl px-6 sm:px-8 lg:px-10"
        } ${
          rev9Aligned ? "" : compact ? "h-16" : "h-20"
        }`}
      >
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-black/30 shadow-[0_0_24px_oklch(0.70_0.18_250/0.14)]">
              <Image
                src="/imlec-icon.png"
                alt=""
                width={88}
                height={88}
                priority
                className="size-10 object-contain"
              />
            </span>
            <span className="min-w-0 leading-none">
              <span className="block truncate text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">
                İmleç Yazılım
              </span>
              <span className="mt-1 hidden text-[11px] text-[var(--text-tertiary)] sm:block">
                Masaüstü yazılım platformu
              </span>
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-7 text-sm text-[var(--text-secondary)] md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-[var(--text-primary)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild variant="brand" size="md" className="hidden lg:inline-flex">
            <Link href="/api/downloads/launcher">
              <Download aria-hidden="true" strokeWidth={1.5} />
              İmleç Launcher&apos;ı indir
            </Link>
          </Button>

          {session?.user ? (
            <div className="group relative hidden pb-3 pt-3 sm:block">
              <button className="flex h-10 items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-white/[0.035] pl-2 pr-3 text-sm text-[var(--text-secondary)] transition group-hover:border-white/20 group-hover:bg-white/[0.06] group-hover:text-[var(--text-primary)]">
                <span className="grid size-6 place-items-center rounded-[var(--radius-sm)] bg-[var(--accent-brand)]/15 font-mono text-[11px] uppercase text-[var(--accent-brand)]">
                  {userInitial}
                </span>
                <span className="hidden max-w-36 truncate lg:block">
                  {session.user.name ?? session.user.email}
                </span>
              </button>
              <div className="invisible absolute right-0 top-[calc(100%-0.5rem)] w-56 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] p-2 opacity-0 shadow-[0_24px_70px_oklch(0_0_0/0.42)] transition duration-[var(--duration-fast)] group-hover:visible group-hover:opacity-100">
                <Link
                  href="/account"
                  className="block rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-white/[0.05] hover:text-[var(--text-primary)]"
                >
                  Hesabım
                </Link>
                <Link
                  href="/account/products"
                  className="block rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-white/[0.05] hover:text-[var(--text-primary)]"
                >
                  Ürünlerim
                </Link>
                <Link
                  href="/account/devices"
                  className="block rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-white/[0.05] hover:text-[var(--text-primary)]"
                >
                  Cihazlar
                </Link>
                <Link
                  href="/account/billing"
                  className="block rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-white/[0.05] hover:text-[var(--text-primary)]"
                >
                  Ödemeler
                </Link>
                <form
                  action={logoutAction}
                  className="mt-1 border-t border-[var(--border-subtle)] pt-1"
                >
                  <button className="block w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-[var(--text-tertiary)] transition hover:bg-white/[0.05] hover:text-[var(--text-primary)]">
                    Çıkış
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] sm:block"
              >
                Giriş
              </Link>
              <Button asChild size="md" className="hidden sm:inline-flex">
                <Link href="/register">Hesap oluştur</Link>
              </Button>
            </>
          )}

          <MobileSiteMenu signedIn={Boolean(session?.user)} />
        </div>
      </div>
    </header>
  );
}

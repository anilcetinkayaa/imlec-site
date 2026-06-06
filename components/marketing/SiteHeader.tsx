import Image from "next/image";
import Link from "next/link";
import { Download, Menu } from "lucide-react";
import { auth } from "@/auth";
import { logoutAction } from "@/app/account/actions";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { ProductSwitcher } from "@/components/marketing/ProductSwitcher";

type SiteHeaderProps = {
  compact?: boolean;
};

const navItems = [
  { href: "/#products", label: "Ürünler" },
  { href: "/changelog", label: "Güncellemeler" },
  { href: "/uyelik", label: "Üyelikler" },
];

export async function SiteHeader({ compact = false }: SiteHeaderProps) {
  const session = await auth();
  const userInitial =
    session?.user?.name?.charAt(0) ?? session?.user?.email?.charAt(0) ?? "İ";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--surface-0)]/82 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--surface-0)]/72">
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10 ${
          compact ? "h-16" : "h-20"
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
          <ProductSwitcher />
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
              Windows için indir
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

          <Dialog>
            <DialogTrigger asChild>
              <button className="inline-flex size-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-white/[0.035] text-[var(--text-secondary)] transition hover:bg-white/[0.06] hover:text-[var(--text-primary)] md:hidden">
                <Menu aria-hidden="true" className="size-5" strokeWidth={1.5} />
                <span className="sr-only">Menüyü aç</span>
              </button>
            </DialogTrigger>
            <DialogContent className="left-auto right-0 top-0 h-dvh w-[min(88vw,360px)] max-w-none translate-x-0 translate-y-0 rounded-none border-y-0 border-l border-r-0 p-5">
              <DialogHeader>
                <DialogTitle>Menü</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-[var(--text-primary)]"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/api/downloads/launcher"
                  className="rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--accent-brand)] hover:bg-[var(--accent-brand)]/10"
                >
                  Windows için indir
                </Link>
                {session?.user ? (
                  <Link
                    href="/account"
                    className="rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-[var(--text-primary)]"
                  >
                    Hesabım
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-[var(--text-primary)]"
                    >
                      Giriş
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-white/[0.05]"
                    >
                      Hesap oluştur
                    </Link>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}

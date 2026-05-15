import Link from "next/link";
import {
  Boxes,
  CreditCard,
  Download,
  FileText,
  LayoutDashboard,
  LogOut,
  MonitorCheck,
  Settings,
  UserRound,
} from "lucide-react";
import { logoutAction } from "@/app/account/actions";
import { SiteHeader } from "@/components/marketing/SiteHeader";

type AccountShellProps = {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
  };
};

const accountLinks = [
  {
    href: "/account",
    label: "Genel Bakış",
    icon: LayoutDashboard,
  },
  {
    href: "/account/products",
    label: "Ürünlerim",
    icon: Boxes,
  },
  {
    href: "/account/devices",
    label: "Cihazlar",
    icon: MonitorCheck,
  },
  {
    href: "/account/billing",
    label: "Ödemeler",
    icon: CreditCard,
  },
  {
    href: "/account/profile",
    label: "Hesap",
    icon: Settings,
  },
];

export function AccountShell({ children, user }: AccountShellProps) {
  const userInitial = user.name?.charAt(0) ?? user.email?.charAt(0) ?? "İ";

  return (
    <main className="min-h-screen bg-[var(--surface-0)] text-[var(--text-primary)]">
      <SiteHeader compact />
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-0 px-6 sm:px-8 lg:grid-cols-[252px_1fr] lg:px-10">
        <aside className="border-b border-[var(--border-subtle)] py-5 lg:border-b-0 lg:border-r lg:pr-5">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3">
            <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-2 pb-4">
              <div className="grid size-10 place-items-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] font-mono text-sm uppercase text-[var(--accent-brand)]">
                {userInitial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-body-s font-medium text-[var(--text-primary)]">
                  {user.name ?? "İmleç kullanıcısı"}
                </p>
                <p className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">
                  {user.email}
                </p>
              </div>
            </div>

            <nav className="mt-3 grid gap-1">
              {accountLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex h-10 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-body-s text-[var(--text-secondary)] transition hover:bg-white/[0.045] hover:text-[var(--text-primary)]"
                  >
                    <Icon className="size-4" strokeWidth={1.5} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 border-t border-[var(--border-subtle)] pt-3">
              <Link
                href="/download"
                className="flex h-10 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-body-s text-[var(--accent-brand)] transition hover:bg-[var(--accent-brand)]/10"
              >
                <Download className="size-4" strokeWidth={1.5} />
                İndirme merkezi
              </Link>
              <Link
                href="/uyelik"
                className="flex h-10 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-body-s text-[var(--text-secondary)] transition hover:bg-white/[0.045] hover:text-[var(--text-primary)]"
              >
                <FileText className="size-4" strokeWidth={1.5} />
                Üyelik talebi
              </Link>
            </div>
          </div>
        </aside>

        <section className="min-w-0 py-5 lg:pl-6">
          <div className="mb-5 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden size-9 place-items-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-tertiary)] sm:grid">
                <UserRound className="size-4" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-mono text-[var(--text-tertiary)]">
                  Hesap paneli / İmleç Yazılım
                </p>
                <p className="truncate text-body-s text-[var(--text-secondary)]">
                  Ürün erişimi, cihazlar ve üyelik bilgileri
                </p>
              </div>
            </div>
            <form action={logoutAction}>
              <button className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-white/[0.025] px-3 text-sm text-[var(--text-secondary)] transition hover:bg-white/[0.055] hover:text-[var(--text-primary)]">
                <LogOut className="size-4" strokeWidth={1.5} />
                Çıkış
              </button>
            </form>
          </div>

          {children}
        </section>
      </div>
    </main>
  );
}

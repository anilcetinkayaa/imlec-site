"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  FileText,
  Headphones,
  KeyRound,
  Lightbulb,
  Megaphone,
  Package,
  ShieldCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/admin", label: "Genel Bakış", icon: BarChart3 },
  { href: "/admin/customers", label: "Müşteriler", icon: Users },
  { href: "/admin/users", label: "Personel Yetkileri", icon: UsersRound },
  { href: "/admin/accounting", label: "Muhasebe", icon: CreditCard },
  { href: "/admin/support", label: "Destek Bildirimleri", icon: Headphones },
  { href: "/admin/feature-suggestions", label: "Özellik Önerileri", icon: Lightbulb },
  { href: "/admin/security", label: "Güvenlik", icon: ShieldCheck },
  { href: "/admin/campaigns", label: "Kampanyalar", icon: Megaphone },
  { href: "/admin/organizations", label: "Şirketler", icon: Building2 },
  { href: "/admin/versions", label: "Sürümler", icon: Package },
  { href: "/admin/announcements", label: "Duyurular", icon: Bell },
  { href: "/admin/lemonsqueezy", label: "Lemon Squeezy", icon: FileText },
  { href: "/account/security", label: "Şifre ve Güvenlik", icon: KeyRound },
] as const;

export function AdminNav({ visibleHrefs }: { visibleHrefs: string[] }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => visibleHrefs.includes(item.href));

  return (
    <nav className="mt-4 grid gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium transition",
              isActive
                ? "bg-[var(--accent-brand)]/12 text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-[var(--text-primary)]",
            )}
          >
            <span
              className={cn(
                "grid size-8 place-items-center rounded-[var(--radius-sm)] border transition",
                isActive
                  ? "border-[var(--accent-brand)]/35 bg-[var(--accent-brand)]/15 text-[var(--accent-brand)]"
                  : "border-[var(--border-subtle)] bg-white/[0.025] text-[var(--text-tertiary)] group-hover:border-[var(--accent-brand)]/25 group-hover:text-[var(--accent-brand)]",
              )}
            >
              <Icon className="size-4" strokeWidth={1.6} />
            </span>
            {item.label}
            {isActive ? (
              <span className="ml-auto size-1.5 rounded-full bg-[var(--accent-brand)]" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

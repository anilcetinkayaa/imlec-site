import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  FileText,
  Headphones,
  KeyRound,
  Megaphone,
  Package,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";

const adminLinks = [
  { href: "/admin", label: "Genel Bakis", icon: BarChart3 },
  { href: "/admin/users", label: "Kullanicilar ve Yetkiler", icon: UsersRound },
  { href: "/admin/accounting", label: "Muhasebe", icon: CreditCard },
  { href: "/admin/support", label: "Destek Bildirimleri", icon: Headphones },
  { href: "/admin/security", label: "Guvenlik", icon: ShieldCheck },
  { href: "/admin/campaigns", label: "Kampanyalar", icon: Megaphone },
  { href: "/admin/organizations", label: "Sirketler", icon: Building2 },
  { href: "/admin/versions", label: "Surumler", icon: Package },
  { href: "/admin/announcements", label: "Duyurular", icon: Bell },
  { href: "/admin/lemonsqueezy", label: "Lemon Squeezy", icon: FileText },
  { href: "/account/security", label: "Sifre ve Guvenlik", icon: KeyRound },
];

function ForbiddenView() {
  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-3xl rounded-xl border border-white/[0.08] bg-white/[0.025] p-6">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-red-300">
          Erisim reddedildi
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Bu alan yalnizca yetkili ekip hesaplari icindir.
        </h1>
        <Link
          href="/account"
          className="mt-6 inline-flex rounded-lg border border-white/[0.12] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.05]"
        >
          Hesap paneline don
        </Link>
      </div>
    </main>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin");
  }

  if (admin.status === "forbidden") {
    return <ForbiddenView />;
  }

  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, name: true, role: true, staffTitle: true },
      })
    : null;
  const initial = user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? "I";

  return (
    <div className="min-h-screen bg-[#08090b] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,0.11),transparent_32%),radial-gradient(circle_at_90%_12%,rgba(16,185,129,0.08),transparent_30%)]" />
      <div className="relative grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-white/[0.08] bg-[#0a0d13]/95 px-4 py-5 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
            <Link href="/admin" className="block">
              <p className="text-xl font-semibold tracking-tight text-white">
                Imlec Admin
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Yonetim ve operasyon merkezi
              </p>
            </Link>

            <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0c0f16] p-3">
              <div className="grid size-10 place-items-center rounded-lg border border-blue-300/25 bg-blue-300/10 font-mono text-sm uppercase text-blue-200">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {user?.name ?? user?.email ?? "Yetkili hesap"}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {user?.staffTitle ?? user?.role ?? "Ekip"}
                </p>
              </div>
            </div>
          </div>

          <nav className="mt-4 grid gap-1">
            {adminLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.055] hover:text-white"
                >
                  <span className="grid size-8 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-zinc-500 transition group-hover:border-blue-300/25 group-hover:text-blue-200">
                    <Icon className="size-4" strokeWidth={1.6} />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-100/80">
            Roller: OWNER tum yetkiler, ADMIN operasyon ve finans, SUPPORT
            destek ve hata takip ekranlari icindir.
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

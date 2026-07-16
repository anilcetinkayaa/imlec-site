import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";
import {
  canUsePermission,
  roleLabel,
  type AdminPermissionKey,
} from "@/src/server/admin-permissions";
import { AdminNav } from "@/components/admin/AdminNav";

const adminLinks: Array<{
  href: string;
  permission?: AdminPermissionKey;
}> = [
  { href: "/admin", permission: "DASHBOARD_VIEW" },
  { href: "/admin/customers", permission: "CUSTOMER_MANAGE" },
  { href: "/admin/users", permission: "STAFF_MANAGE" },
  { href: "/admin/accounting", permission: "BILLING_VIEW" },
  { href: "/admin/support", permission: "SUPPORT_VIEW" },
  { href: "/admin/feature-suggestions", permission: "FEATURE_SUGGESTION_MANAGE" },
  { href: "/admin/security", permission: "SECURITY_VIEW" },
  { href: "/admin/campaigns", permission: "CAMPAIGN_MANAGE" },
  { href: "/admin/organizations", permission: "ORGANIZATION_MANAGE" },
  { href: "/admin/versions", permission: "RELEASE_MANAGE" },
  { href: "/admin/announcements", permission: "RELEASE_MANAGE" },
  { href: "/admin/lemonsqueezy", permission: "LEMONSQUEEZY_VIEW" },
  { href: "/account/security" },
];

function ForbiddenView() {
  return (
    <main className="min-h-screen bg-[var(--surface-0)] px-6 py-10 text-[var(--text-primary)]">
      <div className="mx-auto max-w-3xl rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)]/60 p-6">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--danger)]">
          Erişim reddedildi
        </p>
        <h1 className="text-h2 mt-4">
          Bu alan yalnızca yetkili ekip hesapları içindir.
        </h1>
        <Link
          href="/account"
          className="mt-6 inline-flex rounded-[var(--radius-sm)] border border-[var(--border-default)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-white/[0.05] hover:text-[var(--text-primary)]"
        >
          Hesap paneline dön
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
        select: {
          email: true,
          name: true,
          role: true,
          staffTitle: true,
          staffPermissions: true,
        },
      })
    : null;
  const initial = user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? "İ";
  const visibleHrefs = adminLinks
    .filter((item) =>
      item.permission && user
        ? canUsePermission({
            role: user.role,
            staffPermissions: user.staffPermissions,
            permission: item.permission,
          })
        : true,
    )
    .map((item) => item.href);

  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--text-primary)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_0%,oklch(0.70_0.18_250/0.09),transparent_34%),radial-gradient(circle_at_92%_10%,oklch(0.78_0.16_150/0.06),transparent_30%)]" />
      <div className="relative grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-[var(--border-subtle)] bg-[var(--surface-1)]/70 px-4 py-5 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white/[0.025] p-4">
            <Link href="/admin" className="block">
              <p className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                İmleç Admin
              </p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                Yönetim ve operasyon merkezi
              </p>
            </Link>

            <div className="mt-5 flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-0)]/70 p-3">
              <div className="grid size-10 place-items-center rounded-[var(--radius-sm)] border border-[var(--accent-brand)]/25 bg-[var(--accent-brand)]/10 font-mono text-sm uppercase text-[var(--accent-brand)]">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {user?.name ?? user?.email ?? "Yetkili hesap"}
                </p>
                <p className="truncate text-xs text-[var(--text-tertiary)]">
                  {user?.staffTitle ?? (user ? roleLabel(user.role) : "Ekip")}
                </p>
              </div>
            </div>
          </div>

          <AdminNav visibleHrefs={visibleHrefs} />

          <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--warning)]/15 bg-[var(--warning)]/[0.06] p-3 text-xs leading-5 text-[var(--text-secondary)]">
            Yetkiler personel bazında verilir. Firma Sahibi tüm ekranları
            görür; personel yalnızca yetkili olduğu alanlara erişir.
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

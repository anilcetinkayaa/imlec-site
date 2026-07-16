import { EntitlementStatus, UserRole, type Prisma } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";
import { canUsePermission } from "@/src/server/admin-permissions";
import { customerRelationshipWhere } from "@/src/server/customer-relationship";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
  adminInputClass,
} from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Müşteriler | İmleç Admin",
  description: "Müşteri hesaplarını arayın, filtreleyin ve yönetin.",
};

const PAGE_SIZE = 40;

type CustomersPageProps = {
  searchParams: Promise<{
    q?: string;
    filter?: string;
    page?: string;
  }>;
};

const filters = [
  { key: "all", label: "Tümü" },
  { key: "active", label: "Aktif erişimli" },
  { key: "passive", label: "Erişimsiz" },
  { key: "disabled", label: "Devre dışı" },
] as const;

type FilterKey = (typeof filters)[number]["key"];

function parseFilter(value: string | undefined): FilterKey {
  return (filters.find((item) => item.key === value)?.key ?? "all") as FilterKey;
}

function formatDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function activeEntitlementWhere() {
  return {
    status: {
      in: [EntitlementStatus.ACTIVE, EntitlementStatus.GRACE_PERIOD],
    },
    revokedAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };
}

function isActiveEntitlement(entitlement: {
  status: EntitlementStatus;
  expiresAt: Date | null;
  revokedAt: Date | null;
}) {
  return (
    (entitlement.status === EntitlementStatus.ACTIVE ||
      entitlement.status === EntitlementStatus.GRACE_PERIOD) &&
    !entitlement.revokedAt &&
    (!entitlement.expiresAt || entitlement.expiresAt > new Date())
  );
}

function buildQueryString(params: {
  q?: string;
  filter?: FilterKey;
  page?: number;
}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.filter && params.filter !== "all") search.set("filter", params.filter);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const value = search.toString();
  return value ? `?${value}` : "";
}

export default async function AdminCustomersPage({
  searchParams,
}: CustomersPageProps) {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/customers");
  }

  if (admin.status === "forbidden") {
    redirect("/account");
  }

  const staff = await prisma.user.findUnique({
    where: { id: admin.session.user.id },
    select: { role: true, staffPermissions: true },
  });

  if (
    !staff ||
    !canUsePermission({
      role: staff.role,
      staffPermissions: staff.staffPermissions,
      permission: "CUSTOMER_MANAGE",
    })
  ) {
    redirect("/admin");
  }

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const filter = parseFilter(params.filter);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const customerFilters: Prisma.UserWhereInput[] = [
    customerRelationshipWhere(),
  ];

  if (query) {
    customerFilters.push({
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  if (filter === "active") {
    customerFilters.push({
      entitlements: { some: activeEntitlementWhere() },
    });
  }

  if (filter === "passive") {
    customerFilters.push({
      entitlements: { none: activeEntitlementWhere() },
      disabledAt: null,
    });
  }

  if (filter === "disabled") {
    customerFilters.push({ disabledAt: { not: null } });
  }

  const where: Prisma.UserWhereInput = {
    AND: customerFilters,
  };

  const [totalCount, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        entitlements: {
          include: {
            product: {
              select: { name: true, slug: true },
            },
          },
        },
        devices: {
          select: { id: true, lastSeenAt: true },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <AdminPageHeader
          eyebrow="Müşteri yönetimi"
          title="Müşteriler"
          lead="Müşteri hesaplarını arayın, erişim durumuna göre filtreleyin ve detay sayfasından yönetin."
        />

        <AdminPanel className="mt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <Link
                  key={item.key}
                  href={`/admin/customers${buildQueryString({ q: query, filter: item.key })}`}
                  className={`rounded-[var(--radius-sm)] border px-3 py-2 text-sm transition ${
                    filter === item.key
                      ? "border-[var(--accent-brand)]/50 bg-[var(--accent-brand)]/15 text-[var(--text-primary)]"
                      : "border-[var(--border-default)] bg-[var(--surface-0)]/60 text-[var(--text-secondary)] hover:bg-white/[0.05]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <form className="flex gap-2" action="/admin/customers">
              {filter !== "all" ? (
                <input type="hidden" name="filter" value={filter} />
              ) : null}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="E-posta veya ad ile ara"
                  className={adminInputClass("min-w-72 pl-9")}
                />
              </div>
              <button className="h-11 rounded-[var(--radius-sm)] bg-[var(--accent-brand)] px-5 text-sm font-medium text-[oklch(0.15_0.04_250)] transition hover:brightness-110">
                Ara
              </button>
            </form>
          </div>

          <div className="mt-5 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
            <div className="grid min-w-[880px] grid-cols-[1.5fr_1fr_1fr_1.3fr_0.6fr_1fr_0.6fr] bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              <span>E-posta</span>
              <span>Ad</span>
              <span>Kayıt</span>
              <span>Aktif ürünler</span>
              <span>Cihaz</span>
              <span>Son görülme</span>
              <span>Detay</span>
            </div>

            {users.length > 0 ? (
              users.map((user) => {
                const activeProducts = user.entitlements
                  .filter(isActiveEntitlement)
                  .map((entitlement) => entitlement.product.name);
                const lastDeviceSeenAt = user.devices.reduce<Date | null>(
                  (latest, device) => {
                    if (!device.lastSeenAt) return latest;
                    if (!latest || device.lastSeenAt > latest) {
                      return device.lastSeenAt;
                    }
                    return latest;
                  },
                  null,
                );

                return (
                  <div
                    key={user.id}
                    className="grid min-w-[880px] grid-cols-[1.5fr_1fr_1fr_1.3fr_0.6fr_1fr_0.6fr] items-center border-t border-[var(--border-subtle)] px-4 py-3 text-sm text-[var(--text-secondary)] transition hover:bg-white/[0.02]"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-[var(--text-primary)]">
                        {user.email}
                      </span>
                      {user.disabledAt ? (
                        <span className="shrink-0 rounded-full border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--danger)]">
                          Devre dışı
                        </span>
                      ) : null}
                      {user.role !== UserRole.USER ? (
                        <span className="shrink-0 rounded-full border border-[var(--accent-brand)]/25 bg-[var(--accent-brand)]/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--accent-brand)]">
                          Personel + müşteri
                        </span>
                      ) : null}
                    </span>
                    <span className="truncate">{user.name ?? "-"}</span>
                    <span className="font-mono text-xs">
                      {formatDate(user.createdAt)}
                    </span>
                    <span className="truncate">
                      {activeProducts.length > 0 ? (
                        activeProducts.join(", ")
                      ) : (
                        <span className="text-[var(--text-tertiary)]">Yok</span>
                      )}
                    </span>
                    <span>{user.devices.length}</span>
                    <span className="font-mono text-xs">
                      {formatDate(lastDeviceSeenAt)}
                    </span>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-[var(--accent-brand)] transition hover:brightness-110"
                    >
                      Aç
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="border-t border-[var(--border-subtle)] p-4">
                <AdminEmptyState>
                  {query
                    ? `"${query}" için müşteri bulunamadı.`
                    : "Bu filtrede müşteri yok."}
                </AdminEmptyState>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-[var(--text-tertiary)]">
              {totalCount} müşteri • Sayfa {page}/{totalPages}
            </p>
            <div className="flex gap-2">
              <Link
                aria-disabled={page <= 1}
                href={`/admin/customers${buildQueryString({ q: query, filter, page: page - 1 })}`}
                className={`inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] px-3 py-2 text-sm transition ${
                  page <= 1
                    ? "pointer-events-none opacity-40"
                    : "text-[var(--text-secondary)] hover:bg-white/[0.05]"
                }`}
              >
                <ChevronLeft className="size-4" strokeWidth={1.5} />
                Önceki
              </Link>
              <Link
                aria-disabled={page >= totalPages}
                href={`/admin/customers${buildQueryString({ q: query, filter, page: page + 1 })}`}
                className={`inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] px-3 py-2 text-sm transition ${
                  page >= totalPages
                    ? "pointer-events-none opacity-40"
                    : "text-[var(--text-secondary)] hover:bg-white/[0.05]"
                }`}
              >
                Sonraki
                <ChevronRight className="size-4" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </AdminPanel>
      </div>
    </main>
  );
}

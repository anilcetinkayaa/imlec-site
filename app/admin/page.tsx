import {
  AccessRequestStatus,
  EntitlementSource,
  EntitlementStatus,
  PaymentStatus,
  SubscriptionStatus,
} from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";
import {
  approveAccessRequest,
  rejectAccessRequest,
} from "./access-requests/actions";

export const metadata: Metadata = {
  title: "Yönetim Merkezi | İmleç Yazılım",
  description: "İmleç Yazılım kullanıcı, ürün, ödeme ve operasyon yönetimi.",
};

type AdminPageProps = {
  searchParams: Promise<{
    q?: string;
    tax?: string;
  }>;
};

const suspiciousReasons = [
  "DEVICE_SHARED_ACROSS_TOO_MANY_ACCOUNTS",
  "DEVICE_REVOKED_REGISTER_ATTEMPT",
  "ENTITLEMENT_INACTIVE_REGISTER_ATTEMPT",
  "DESKTOP_PRODUCTS_DEVICE_SHARED_SUSPICIOUS",
  "DESKTOP_DOWNLOAD_ENTITLEMENT_INVALID",
  "DESKTOP_DOWNLOAD_DEVICE_REVOKED",
  "DESKTOP_DOWNLOAD_SESSION_INVALID",
];

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

function formatMoney(cents: number, currency = "TRY") {
  return (cents / 100).toLocaleString("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
}

function monthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function yearStart() {
  const now = new Date();
  return new Date(now.getFullYear(), 0, 1);
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

function parseTaxRate(value: string | undefined) {
  const parsed = Number(value);
  if ([0, 1, 10, 20].includes(parsed)) {
    return parsed;
  }
  return 20;
}

function inclusiveTaxAmount(grossCents: number, rate: number) {
  if (rate <= 0) {
    return 0;
  }
  return Math.round(grossCents * (rate / (100 + rate)));
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

function StatCard({
  title,
  value,
  note,
  tone = "blue",
}: {
  title: string;
  value: string | number;
  note: string;
  tone?: "blue" | "emerald" | "amber" | "red" | "purple" | "zinc";
}) {
  const toneClasses = {
    blue: "border-blue-300/20 bg-blue-300/[0.06] text-blue-200",
    emerald: "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200",
    amber: "border-amber-300/20 bg-amber-300/[0.06] text-amber-200",
    red: "border-red-300/20 bg-red-300/[0.06] text-red-200",
    purple: "border-purple-300/20 bg-purple-300/[0.06] text-purple-200",
    zinc: "border-white/[0.08] bg-white/[0.025] text-zinc-200",
  }[tone];

  return (
    <div className={`rounded-xl border p-5 ${toneClasses}`}>
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-zinc-500">{note}</p>
    </div>
  );
}

function ForbiddenView() {
  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-3xl rounded-xl border border-white/[0.08] bg-white/[0.025] p-6">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-red-300">
          Erişim reddedildi
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Bu alan yalnızca yönetici yetkisi olan kullanıcılar içindir.
        </h1>
        <Link
          href="/account"
          className="mt-6 inline-flex rounded-lg border border-white/[0.12] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.05]"
        >
          Üyelik paneline dön
        </Link>
      </div>
    </main>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin");
  }

  if (admin.status === "forbidden") {
    return <ForbiddenView />;
  }

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const taxRate = parseTaxRate(params.tax);
  const showFinancials =
    admin.session.user.role === "OWNER" || admin.session.user.role === "ADMIN";

  const [
    users,
    pendingAccessRequests,
    totalUsers,
    activeEntitlements,
    paidActiveEntitlements,
    manualActiveEntitlements,
    activeDevices,
    openSupportCount,
    openBillingRequestCount,
    suspiciousLogCount,
    monthPayments,
    yearPayments,
    refundedPayments,
    subscriptionCounts,
    latestVersions,
  ] = await Promise.all([
    prisma.user.findMany({
      where: query
        ? {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      include: {
        entitlements: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        devices: {
          select: {
            id: true,
            lastSeenAt: true,
          },
        },
      },
    }),
    prisma.accessRequest.findMany({
      where: {
        status: AccessRequestStatus.PENDING,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 20,
      include: {
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    }),
    prisma.user.count(),
    prisma.entitlement.findMany({
      where: activeEntitlementWhere(),
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.entitlement.findMany({
      where: {
        ...activeEntitlementWhere(),
        source: EntitlementSource.LEMON_SQUEEZY,
      },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.entitlement.findMany({
      where: {
        ...activeEntitlementWhere(),
        source: {
          in: [
            EntitlementSource.ADMIN,
            EntitlementSource.MANUAL,
            EntitlementSource.TRIAL,
          ],
        },
      },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.device.count({
      where: {
        status: "ACTIVE",
        revokedAt: null,
      },
    }),
    prisma.supportTicket.count({
      where: {
        status: {
          in: ["OPEN", "IN_PROGRESS"],
        },
      },
    }),
    prisma.billingRequest.count({
      where: {
        status: {
          in: ["OPEN", "REVIEWING"],
        },
      },
    }),
    prisma.downloadLog.count({
      where: {
        reason: {
          in: suspiciousReasons,
        },
        createdAt: {
          gte: monthStart(),
        },
      },
    }),
    prisma.payment.aggregate({
      where: {
        status: PaymentStatus.PAID,
        paidAt: {
          gte: monthStart(),
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: {
        status: PaymentStatus.PAID,
        paidAt: {
          gte: yearStart(),
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: {
        status: PaymentStatus.REFUNDED,
      },
      _sum: {
        amount: true,
      },
      _count: true,
    }),
    prisma.subscription.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.productVersion.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      include: {
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    }),
  ]);

  const activeUserCount = activeEntitlements.length;
  const paidActiveUserCount = paidActiveEntitlements.length;
  const manualActiveUserCount = manualActiveEntitlements.length;
  const inactiveUserCount = Math.max(totalUsers - activeUserCount, 0);
  const monthlyRevenue = monthPayments._sum.amount ?? 0;
  const yearlyRevenue = yearPayments._sum.amount ?? 0;
  const selectedMonthlyTax = inclusiveTaxAmount(monthlyRevenue, taxRate);
  const selectedYearlyTax = inclusiveTaxAmount(yearlyRevenue, taxRate);
  const subscriptionSummary = new Map(
    subscriptionCounts.map((item) => [item.status, item._count]),
  );

  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-blue-300/80">
              Yönetim Merkezi
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Operasyon ve büyüme kokpiti
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              Kullanıcı, ödeme, cihaz, destek, güvenlik ve yayın durumunu tek
              ekrandan izleyin. Finansal kartlar yalnızca yetkili rollere
              gösterilir.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              ["/admin/security", "Güvenlik"],
              ["/admin/support", "Destek"],
              ["/admin/accounting", "Muhasebe"],
              ["/admin/versions", "Sürümler"],
              ["/admin/campaigns", "Kampanyalar"],
              ["/admin/organizations", "Şirketler"],
              ["/admin/announcements", "Duyurular"],
              ["/admin/lemonsqueezy", "Lemon Squeezy"],
              ["/account", "Üyelik paneli"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg border border-white/[0.12] bg-white/[0.025] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.06]"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Aktif ücretli kullanıcı"
            value={paidActiveUserCount}
            note="Lemon Squeezy kaynaklı aktif erişim sayısı."
            tone="emerald"
          />
          <StatCard
            title="Toplam aktif kullanıcı"
            value={activeUserCount}
            note={`Manuel/deneme dahil. ${inactiveUserCount} kullanıcı pasif veya erişimsiz.`}
            tone="blue"
          />
          <StatCard
            title="Aktif cihaz"
            value={activeDevices}
            note="Engellenmemiş masaüstü cihaz kayıtları."
            tone="purple"
          />
          <StatCard
            title="Açık iş"
            value={pendingAccessRequests.length + openSupportCount + openBillingRequestCount}
            note={`${pendingAccessRequests.length} erişim, ${openSupportCount} destek, ${openBillingRequestCount} iptal/iade talebi.`}
            tone="amber"
          />
        </section>

        {showFinancials ? (
          <section className="mt-6 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.035] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-200/80">
                  Finansal özet
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Gelir, iade ve tahmini vergi görünümü
                </h2>
                <p className="mt-2 max-w-3xl text-sm text-zinc-400">
                  Vergi kartları muhasebe teyidi gelene kadar senaryo hesabıdır.
                  Oran seçimi sadece bu ekranın hesaplamasını değiştirir.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 10, 20].map((rate) => (
                  <Link
                    key={rate}
                    href={`/admin?tax=${rate}`}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${
                      taxRate === rate
                        ? "border-emerald-300/50 bg-emerald-300/20 text-emerald-100"
                        : "border-white/[0.1] bg-[#0c0d10] text-zinc-300 hover:bg-white/[0.05]"
                    }`}
                  >
                    %{rate}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Bu ay tahsilat"
                value={formatMoney(monthlyRevenue)}
                note={`${monthPayments._count} ödeme kaydı.`}
                tone="emerald"
              />
              <StatCard
                title="Bu yıl tahsilat"
                value={formatMoney(yearlyRevenue)}
                note={`${yearPayments._count} ödeme kaydı.`}
                tone="emerald"
              />
              <StatCard
                title={`Bu ay tahmini vergi (%${taxRate})`}
                value={formatMoney(selectedMonthlyTax)}
                note={`Net tahmini: ${formatMoney(monthlyRevenue - selectedMonthlyTax)}.`}
                tone="amber"
              />
              <StatCard
                title="Toplam iade"
                value={formatMoney(refundedPayments._sum.amount ?? 0)}
                note={`${refundedPayments._count} iade kaydı.`}
                tone="red"
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-white/[0.08] bg-[#0c0d10] p-4">
                <p className="text-sm text-zinc-500">Aktif abonelik</p>
                <p className="mt-2 text-2xl font-semibold">
                  {subscriptionSummary.get(SubscriptionStatus.ACTIVE) ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-[#0c0d10] p-4">
                <p className="text-sm text-zinc-500">Denemede</p>
                <p className="mt-2 text-2xl font-semibold">
                  {subscriptionSummary.get(SubscriptionStatus.TRIALING) ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-[#0c0d10] p-4">
                <p className="text-sm text-zinc-500">Ödeme problemi</p>
                <p className="mt-2 text-2xl font-semibold">
                  {subscriptionSummary.get(SubscriptionStatus.PAST_DUE) ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-[#0c0d10] p-4">
                <p className="text-sm text-zinc-500">Yıl tahmini vergi</p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatMoney(selectedYearlyTax)}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-blue-300/80">
                  Bugünkü iş listesi
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Bekleyen erişim talepleri
                </h2>
              </div>
              <span className="font-mono text-xs text-zinc-500">
                {pendingAccessRequests.length} bekleyen talep
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              {pendingAccessRequests.length > 0 ? (
                pendingAccessRequests.map((request) => (
                  <div
                    key={request.id}
                    className="grid gap-4 rounded-lg border border-white/[0.07] bg-[#0c0d10] p-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {request.email}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {request.user.name ?? "Ad kaydı yok"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                        Ürün
                      </p>
                      <p className="mt-1 text-sm text-zinc-300">
                        {request.product?.name ?? request.productCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                        Tarih
                      </p>
                      <p className="mt-1 font-mono text-xs text-zinc-300">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                      <form action={approveAccessRequest}>
                        <input name="id" type="hidden" value={request.id} />
                        <button className="h-9 w-full rounded-lg bg-emerald-400 px-3 text-sm font-medium text-emerald-950 transition hover:bg-emerald-300 sm:w-auto">
                          Onayla
                        </button>
                      </form>
                      <form action={rejectAccessRequest}>
                        <input name="id" type="hidden" value={request.id} />
                        <button className="h-9 w-full rounded-lg border border-red-400/30 bg-red-400/10 px-3 text-sm font-medium text-red-200 transition hover:bg-red-400/15 sm:w-auto">
                          Reddet
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-white/[0.07] bg-[#0c0d10] px-4 py-4 text-sm text-zinc-500">
                  Bekleyen erişim talebi yok.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-red-300/80">
              Uyarılar
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Takip edilmesi gerekenler
            </h2>
            <div className="mt-5 grid gap-3">
              <Link
                href="/admin/support"
                className="rounded-lg border border-white/[0.07] bg-[#0c0d10] p-4 transition hover:bg-white/[0.04]"
              >
                <p className="text-sm text-zinc-500">Açık destek bildirimi</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {openSupportCount}
                </p>
              </Link>
              <Link
                href="/admin/security"
                className="rounded-lg border border-white/[0.07] bg-[#0c0d10] p-4 transition hover:bg-white/[0.04]"
              >
                <p className="text-sm text-zinc-500">Bu ay şüpheli güvenlik olayı</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {suspiciousLogCount}
                </p>
              </Link>
              <Link
                href="/admin/accounting"
                className="rounded-lg border border-white/[0.07] bg-[#0c0d10] p-4 transition hover:bg-white/[0.04]"
              >
                <p className="text-sm text-zinc-500">Açık iptal/iade talebi</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {openBillingRequestCount}
                </p>
              </Link>
              <Link
                href="/admin/campaigns"
                className="rounded-lg border border-white/[0.07] bg-[#0c0d10] p-4 transition hover:bg-white/[0.04]"
              >
                <p className="text-sm text-zinc-500">Manuel/deneme erişimi</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {manualActiveUserCount}
                </p>
              </Link>
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
                Kullanıcı arama
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Kullanıcılar
              </h2>
            </div>
            <form className="flex flex-col gap-3 sm:flex-row" action="/admin">
              <input
                name="q"
                defaultValue={query}
                placeholder="Email veya ad ile ara"
                className="h-11 min-w-72 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-blue-300/50"
              />
              <button className="h-11 rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-950 transition hover:bg-white">
                Ara
              </button>
            </form>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.08]">
            <div className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr_1.2fr_0.7fr_1fr_0.7fr] bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <span>Email</span>
              <span>Ad</span>
              <span>Rol</span>
              <span>Kayıt</span>
              <span>Aktif ürünler</span>
              <span>Cihaz</span>
              <span>Son cihaz</span>
              <span>Detay</span>
            </div>

            {users.length > 0 ? (
              users.map((user) => {
                const activeProducts = user.entitlements
                  .filter(isActiveEntitlement)
                  .map((entitlement) => entitlement.product.name);
                const lastDeviceSeenAt = user.devices.reduce<Date | null>(
                  (latest, device) => {
                    if (!device.lastSeenAt) {
                      return latest;
                    }

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
                    className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr_1.2fr_0.7fr_1fr_0.7fr] border-t border-white/[0.07] px-4 py-3 text-sm text-zinc-300"
                  >
                    <span className="truncate text-white">{user.email}</span>
                    <span className="truncate">{user.name ?? "-"}</span>
                    <span>{user.role}</span>
                    <span>{formatDate(user.createdAt)}</span>
                    <span className="truncate">
                      {activeProducts.length > 0
                        ? activeProducts.join(", ")
                        : "Yok"}
                    </span>
                    <span>{user.devices.length}</span>
                    <span>{formatDate(lastDeviceSeenAt)}</span>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-blue-300 transition hover:text-blue-200"
                    >
                      Aç
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="border-t border-white/[0.07] px-4 py-5 text-sm text-zinc-500">
                Kullanıcı bulunamadı.
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-300/80">
                Son yayınlar
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Ürün sürümleri
              </h2>
            </div>
            <Link href="/admin/versions" className="text-sm text-emerald-200 hover:text-emerald-100">
              Sürümleri aç
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {latestVersions.length > 0 ? (
              latestVersions.map((version) => (
                <div
                  key={version.id}
                  className="grid gap-3 rounded-lg border border-white/[0.07] bg-[#0c0d10] px-4 py-3 text-sm text-zinc-300 md:grid-cols-[1fr_0.6fr_1.4fr_0.8fr]"
                >
                  <span>{version.product.name}</span>
                  <span className="font-mono text-emerald-200">{version.version}</span>
                  <span className="truncate text-zinc-500">{version.filePath}</span>
                  <span>{formatDate(version.createdAt)}</span>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-white/[0.07] bg-[#0c0d10] px-4 py-4 text-sm text-zinc-500">
                Henüz sürüm kaydı yok.
              </div>
            )}
          </div>
        </section>

        <p className="mt-6 text-xs leading-5 text-zinc-600">
          Vergi hesapları bilgilendirme amaçlıdır. Lemon Squeezy Merchant of
          Record yapısı ve Türkiye muhasebe/fatura yükümlülüğü mali müşavirle
          netleştirilmelidir.
        </p>
      </div>
    </main>
  );
}

import {
  EntitlementSource,
  EntitlementStatus,
  PaymentStatus,
  SubscriptionStatus,
} from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";
import { getLemonSqueezySubscriptionForOrder } from "@/src/server/lemonsqueezy-api";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
} from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Yönetim Merkezi | İmleç Yazılım",
  description: "İmleç Yazılım kullanıcı, ürün, ödeme ve operasyon yönetimi.",
};

type AdminPageProps = {
  searchParams: Promise<{
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

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin");
  }

  if (admin.status === "forbidden") {
    redirect("/account");
  }

  const params = await searchParams;
  const taxRate = parseTaxRate(params.tax);
  const showFinancials =
    admin.session.user.role === "OWNER" || admin.session.user.role === "ADMIN";

  const [
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
    testPayments,
    refundedPayments,
    subscriptionCounts,
    trialSubscriptions,
    activeTestMemberships,
    recentLemonMemberships,
    recentOrderEvents,
    latestVersions,
  ] = await Promise.all([
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
        testMode: false,
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
        testMode: false,
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
        status: PaymentStatus.PAID,
        testMode: true,
      },
      _sum: {
        amount: true,
      },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: {
        status: PaymentStatus.REFUNDED,
        testMode: false,
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
    prisma.subscription.findMany({
      where: {
        provider: "lemonsqueezy",
        status: SubscriptionStatus.TRIALING,
      },
      distinct: ["userId"],
      select: {
        userId: true,
      },
    }),
    prisma.entitlement.findMany({
      where: {
        ...activeEntitlementWhere(),
        source: EntitlementSource.LEMON_SQUEEZY,
        user: {
          payments: {
            some: {
              provider: "lemonsqueezy",
              status: PaymentStatus.PAID,
              testMode: true,
            },
          },
        },
      },
      distinct: ["userId"],
      select: {
        userId: true,
      },
    }),
    prisma.entitlement.findMany({
      where: {
        source: EntitlementSource.LEMON_SQUEEZY,
      },
      distinct: ["userId"],
      orderBy: {
        updatedAt: "desc",
      },
      take: 8,
      include: {
        user: {
          select: {
            email: true,
            payments: {
              where: {
                provider: "lemonsqueezy",
                status: PaymentStatus.PAID,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
              select: {
                testMode: true,
              },
            },
          },
        },
        product: {
          select: {
            name: true,
          },
        },
        subscription: {
          select: {
            status: true,
            renewsAt: true,
            endsAt: true,
            trialEndsAt: true,
          },
        },
      },
    }),
    prisma.lemonSqueezyWebhookEvent.findMany({
      where: {
        eventName: "order_created",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      select: {
        payload: true,
      },
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
  const trialUserCount = new Set([
    ...trialSubscriptions.map((subscription) => subscription.userId),
    ...activeTestMemberships.map((entitlement) => entitlement.userId),
  ]).size;
  const orderIdByUser = new Map<string, string>();

  for (const event of recentOrderEvents) {
    const payload = event.payload as {
      meta?: { custom_data?: { user_id?: string } };
      data?: { id?: string };
    };
    const userId = payload.meta?.custom_data?.user_id;
    const orderId = payload.data?.id;

    if (userId && orderId && !orderIdByUser.has(userId)) {
      orderIdByUser.set(userId, orderId);
    }
  }

  const providerSubscriptions = new Map(
    await Promise.all(
      recentLemonMemberships.map(async (membership) => {
        if (membership.subscription) {
          return [membership.userId, null] as const;
        }

        const orderId = orderIdByUser.get(membership.userId);
        const subscription = orderId
          ? await getLemonSqueezySubscriptionForOrder(orderId)
          : null;
        return [membership.userId, subscription] as const;
      }),
    ),
  );

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <AdminPageHeader
          eyebrow="Yönetim Merkezi"
          title="Operasyon ve büyüme kokpiti"
          lead="Kullanıcı, ödeme, cihaz, destek, güvenlik ve yayın durumunu tek ekrandan izleyin. Finansal kartlar yalnızca yetkili rollere gösterilir."
          actions={
            <Link
              href="/admin/customers"
              className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-white/[0.05] hover:text-[var(--text-primary)]"
            >
              Müşteri listesine git
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </Link>
          }
        />

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            title="Aktif ücretli kullanıcı"
            value={paidActiveUserCount}
            note="Lemon Squeezy kaynaklı aktif erişim sayısı."
            tone="success"
          />
          <AdminStatCard
            title="Toplam aktif kullanıcı"
            value={activeUserCount}
            note={`Manuel/deneme dahil. ${inactiveUserCount} kullanıcı pasif veya erişimsiz.`}
            tone="brand"
          />
          <AdminStatCard
            title="Aktif cihaz"
            value={activeDevices}
            note="Engellenmemiş masaüstü cihaz kayıtları."
            tone="purple"
          />
          <AdminStatCard
            title="Açık iş"
            value={openSupportCount + openBillingRequestCount}
            note={`${openSupportCount} destek, ${openBillingRequestCount} iptal/iade talebi.`}
            tone="warning"
          />
        </section>

        {showFinancials ? (
          <AdminPanel
            className="mt-6"
            tone="success"
            eyebrow="Finansal özet"
            title="Gelir, iade ve tahmini vergi görünümü"
            actions={
              <div className="flex flex-wrap gap-2">
                {[0, 1, 10, 20].map((rate) => (
                  <Link
                    key={rate}
                    href={`/admin?tax=${rate}`}
                    className={`rounded-[var(--radius-sm)] border px-3 py-2 text-sm transition ${
                      taxRate === rate
                        ? "border-[var(--success)]/50 bg-[var(--success)]/20 text-[var(--text-primary)]"
                        : "border-[var(--border-default)] bg-[var(--surface-0)]/60 text-[var(--text-secondary)] hover:bg-white/[0.05]"
                    }`}
                  >
                    %{rate}
                  </Link>
                ))}
              </div>
            }
          >
            <p className="text-body-s mt-2 max-w-3xl text-[var(--text-secondary)]">
              Vergi kartları muhasebe teyidi gelene kadar senaryo hesabıdır.
              Oran seçimi sadece bu ekranın hesaplamasını değiştirir.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <AdminStatCard
                title="Bu ay tahsilat"
                value={formatMoney(monthlyRevenue)}
                note={`${monthPayments._count} ödeme kaydı.`}
                tone="success"
              />
              <AdminStatCard
                title="Bu yıl tahsilat"
                value={formatMoney(yearlyRevenue)}
                note={`${yearPayments._count} ödeme kaydı.`}
                tone="success"
              />
              <AdminStatCard
                title="Test üyeliği"
                value={activeTestMemberships.length}
                note={`${testPayments._count} test siparişi. Test tahsilatı: ${formatMoney(testPayments._sum.amount ?? 0)}.`}
                tone="purple"
              />
              <AdminStatCard
                title={`Bu ay tahmini vergi (%${taxRate})`}
                value={formatMoney(selectedMonthlyTax)}
                note={`Net tahmini: ${formatMoney(monthlyRevenue - selectedMonthlyTax)}.`}
                tone="warning"
              />
              <AdminStatCard
                title="Toplam iade"
                value={formatMoney(refundedPayments._sum.amount ?? 0)}
                note={`${refundedPayments._count} iade kaydı.`}
                tone="danger"
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              {[
                ["Aktif abonelik", subscriptionSummary.get(SubscriptionStatus.ACTIVE) ?? 0],
                ["Denemede", trialUserCount],
                ["Ödeme problemi", subscriptionSummary.get(SubscriptionStatus.PAST_DUE) ?? 0],
                ["Yıl tahmini vergi", formatMoney(selectedYearlyTax)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-0)]/60 p-4"
                >
                  <p className="text-sm text-[var(--text-tertiary)]">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </AdminPanel>
        ) : null}

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <AdminPanel
            eyebrow="Lemon Squeezy"
            title="Üyelik ve yenileme takvimi"
            actions={
              <Link
                href="/admin/lemonsqueezy"
                className="text-sm text-[var(--accent-brand)] transition hover:brightness-110"
              >
                Tüm kayıtları aç
              </Link>
            }
          >
            <div className="mt-5 grid gap-3">
              {recentLemonMemberships.length > 0 ? (
                recentLemonMemberships.map((membership) => {
                  const subscription = membership.subscription;
                  const providerSubscription = providerSubscriptions.get(
                    membership.userId,
                  );
                  const isTest =
                    providerSubscription?.testMode ??
                    (membership.user.payments[0]?.testMode === true);
                  const effectiveStatus =
                    subscription?.status ??
                    providerSubscription?.status ??
                    (isTest && membership.status === EntitlementStatus.ACTIVE
                      ? SubscriptionStatus.TRIALING
                      : membership.status);
                  const scheduleDate =
                    effectiveStatus === SubscriptionStatus.TRIALING ||
                    effectiveStatus === "on_trial"
                      ? subscription?.trialEndsAt ??
                        providerSubscription?.trialEndsAt
                      : effectiveStatus === SubscriptionStatus.CANCELED ||
                          effectiveStatus === SubscriptionStatus.EXPIRED ||
                          effectiveStatus === "cancelled" ||
                          effectiveStatus === "expired"
                        ? subscription?.endsAt ?? providerSubscription?.endsAt
                        : subscription?.renewsAt ??
                          providerSubscription?.renewsAt;
                  const scheduleLabel =
                    effectiveStatus === SubscriptionStatus.TRIALING ||
                    effectiveStatus === "on_trial"
                      ? "Deneme bitişi"
                      : effectiveStatus === SubscriptionStatus.CANCELED ||
                          effectiveStatus === SubscriptionStatus.EXPIRED ||
                          effectiveStatus === "cancelled" ||
                          effectiveStatus === "expired"
                        ? "Erişim bitişi"
                        : "Sonraki yenileme";

                  return (
                    <div
                      key={membership.id}
                      className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-0)]/60 px-4 py-3 md:grid-cols-[1.3fr_0.7fr_0.8fr_1fr]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {membership.user.email}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                          {membership.product.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                          Ortam
                        </p>
                        <span className="mt-1 inline-flex rounded-[var(--radius-sm)] border border-[var(--accent-cozver)]/25 bg-[var(--accent-cozver)]/10 px-2 py-1 font-mono text-[11px] text-[var(--accent-cozver)]">
                          {isTest ? "TEST" : "LIVE"}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                          Durum
                        </p>
                        <p className="mt-1 font-mono text-xs text-[var(--text-primary)]">
                          {effectiveStatus}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                          {scheduleLabel}
                        </p>
                        <p className="mt-1 font-mono text-xs text-[var(--text-secondary)]">
                          {scheduleDate
                            ? formatDate(scheduleDate)
                            : "Abonelik webhook'u alınmadı"}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <AdminEmptyState>Lemon Squeezy üyelik kaydı yok.</AdminEmptyState>
              )}
            </div>
          </AdminPanel>

          <AdminPanel eyebrow="Uyarılar" title="Takip edilmesi gerekenler">
            <div className="mt-5 grid gap-3">
              {[
                ["/admin/support", "Açık destek bildirimi", openSupportCount],
                ["/admin/security", "Bu ay şüpheli güvenlik olayı", suspiciousLogCount],
                ["/admin/accounting", "Açık iptal/iade talebi", openBillingRequestCount],
                ["/admin/campaigns", "Manuel/deneme erişimi", manualActiveUserCount],
              ].map(([href, label, value]) => (
                <Link
                  key={String(href)}
                  href={String(href)}
                  className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-0)]/60 p-4 transition hover:bg-white/[0.04]"
                >
                  <p className="text-sm text-[var(--text-tertiary)]">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                    {value}
                  </p>
                </Link>
              ))}
            </div>
          </AdminPanel>
        </section>

        <AdminPanel
          className="mt-6"
          eyebrow="Son yayınlar"
          title="Ürün sürümleri"
          actions={
            <Link
              href="/admin/versions"
              className="text-sm text-[var(--success)] transition hover:brightness-110"
            >
              Sürümleri aç
            </Link>
          }
        >
          <div className="mt-4 grid gap-3">
            {latestVersions.length > 0 ? (
              latestVersions.map((version) => (
                <div
                  key={version.id}
                  className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-0)]/60 px-4 py-3 text-sm text-[var(--text-secondary)] md:grid-cols-[1fr_0.6fr_1.4fr_0.8fr]"
                >
                  <span>{version.product.name}</span>
                  <span className="font-mono text-[var(--success)]">
                    {version.version}
                  </span>
                  <span className="truncate text-[var(--text-tertiary)]">
                    {version.filePath}
                  </span>
                  <span>{formatDate(version.createdAt)}</span>
                </div>
              ))
            ) : (
              <AdminEmptyState>Henüz sürüm kaydı yok.</AdminEmptyState>
            )}
          </div>
        </AdminPanel>

        <p className="mt-6 text-xs leading-5 text-[var(--text-tertiary)]">
          Vergi hesapları bilgilendirme amaçlıdır. Lemon Squeezy Merchant of
          Record yapısı ve Türkiye muhasebe/fatura yükümlülüğü mali müşavirle
          netleştirilmelidir.
        </p>
      </div>
    </main>
  );
}

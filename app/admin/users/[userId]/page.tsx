import type { Metadata } from "next";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";
import { reconcileLemonSqueezyUserSubscriptions } from "@/src/server/lemonsqueezy-reconcile";
import { AdminUserDetailTabs } from "./admin-user-detail-tabs";
import {
  resetUserPassword,
  updateStaffPermissions,
} from "../actions";
import {
  ADMIN_PERMISSIONS,
  roleLabel,
} from "@/src/server/admin-permissions";

export const metadata: Metadata = {
  title: "Kullanıcı Detayı | İmleç Yazılım Admin",
};

type AdminUserPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

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

function formatMoney(amount: number, currency: string) {
  return (amount / 100).toLocaleString("tr-TR", {
    style: "currency",
    currency,
  });
}

function membershipDuration(startedAt: Date | null) {
  if (!startedAt) {
    return "-";
  }

  const days = Math.max(
    0,
    Math.floor((Date.now() - startedAt.getTime()) / (24 * 60 * 60 * 1000)),
  );
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;

  if (months < 1) {
    return `${days} gündür`;
  }

  return remainingDays
    ? `${months} ay ${remainingDays} gündür`
    : `${months} aydır`;
}

function versionParts(value: string | null) {
  return (value ?? "")
    .replace(/^v/i, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0));
}

function versionIsOlder(current: string | null, latest: string | null) {
  if (!current || !latest) {
    return null;
  }

  const left = versionParts(current);
  const right = versionParts(latest);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const currentPart = left[index] ?? 0;
    const latestPart = right[index] ?? 0;
    if (currentPart !== latestPart) {
      return currentPart < latestPart;
    }
  }

  return false;
}

function ForbiddenView() {
  return (
    <main className="min-h-screen px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-3xl rounded-xl border border-white/[0.08] bg-white/[0.025] p-6">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-red-300">
          Erişim reddedildi
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Bu alan yalnızca ADMIN rolü içindir.
        </h1>
      </div>
    </main>
  );
}

export default async function AdminUserPage({ params }: AdminUserPageProps) {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin");
  }

  if (admin.status === "forbidden") {
    return <ForbiddenView />;
  }

  const { userId } = await params;
  try {
    await reconcileLemonSqueezyUserSubscriptions(userId);
  } catch (error) {
    console.error(
      "[ADMIN SUBSCRIPTION SYNC ERROR]",
      error instanceof Error ? error.message : "UNKNOWN_ERROR",
    );
  }

  const [
    user,
    products,
    fis260Product,
    recentDownloadLogs,
    actionLogs,
    notes,
    latestFis260Version,
    latestLauncherVersion,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        entitlements: {
          orderBy: { createdAt: "desc" },
          include: {
            subscription: {
              select: {
                status: true,
                renewsAt: true,
                endsAt: true,
                trialEndsAt: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        devices: {
          orderBy: { lastSeenAt: "desc" },
          select: {
            id: true,
            deviceName: true,
            os: true,
            appVersion: true,
            launcherVersion: true,
            status: true,
            lastSeenAt: true,
            trustedUntil: true,
            revokedAt: true,
            createdAt: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        subscriptions: {
          where: { provider: "lemonsqueezy" },
          orderBy: { updatedAt: "desc" },
          include: {
            product: { select: { name: true } },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          include: {
            product: { select: { name: true } },
          },
        },
      },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
    prisma.product.findUnique({
      where: { slug: "fis260" },
      select: {
        id: true,
        slug: true,
      },
    }),
    prisma.downloadLog.findMany({
      where: {
        userId,
        productSlug: "fis260",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        success: true,
        reason: true,
        createdAt: true,
      },
    }),
    prisma.adminActionLog.findMany({
      where: {
        targetUserId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        adminId: true,
        action: true,
        before: true,
        after: true,
        ipAddress: true,
        createdAt: true,
      },
    }),
    prisma.userNote.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        adminId: true,
        body: true,
        createdAt: true,
      },
    }),
    prisma.productVersion.findFirst({
      where: { product: { slug: "fis260" } },
      orderBy: { createdAt: "desc" },
      select: { version: true },
    }),
    prisma.productVersion.findFirst({
      where: { product: { slug: "launcher" } },
      orderBy: { createdAt: "desc" },
      select: { version: true },
    }),
  ]);

  if (!user) {
    notFound();
  }

  const actionAdminIds = [
    ...new Set(actionLogs.map((log) => log.adminId)),
  ];
  const actionAdmins = actionAdminIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actionAdminIds } },
        select: { id: true, name: true, username: true, email: true },
      })
    : [];
  const actionAdminNames = new Map(
    actionAdmins.map((actor) => [
      actor.id,
      actor.name ?? actor.username ?? actor.email,
    ]),
  );

  const canManageStaff =
    admin.session.user.role === UserRole.OWNER ||
    admin.session.user.role === UserRole.ADMIN;
  const activeEntitlementCount = user.entitlements.filter(
    (entitlement) =>
      (entitlement.status === "ACTIVE" ||
        entitlement.status === "GRACE_PERIOD") &&
      !entitlement.revokedAt &&
      (!entitlement.expiresAt || entitlement.expiresAt > new Date()),
  ).length;
  const activeDeviceCount = user.devices.filter(
    (device) => device.status === "ACTIVE" && !device.revokedAt,
  ).length;
  const displayName = user.name?.trim() || user.email;
  const activeSubscription = user.subscriptions.find((subscription) =>
    ["ACTIVE", "TRIALING", "PAST_DUE", "PAUSED"].includes(
      subscription.status,
    ),
  );
  const membershipStartedAt =
    activeSubscription?.createdAt ??
    user.entitlements
      .filter((entitlement) => entitlement.source === "LEMON_SQUEEZY")
      .map((entitlement) => entitlement.startsAt)
      .sort((left, right) => left.getTime() - right.getTime())[0] ??
    null;
  const paidPayments = user.payments.filter(
    (payment) => payment.status === "PAID",
  );
  const lastPayment = paidPayments[0] ?? null;
  const totalPaid = paidPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const initial = displayName.slice(0, 1).toLocaleUpperCase("tr-TR");
  const summaryStats: Array<{
    label: string;
    value: number;
    icon: LucideIcon;
  }> = [
    { label: "Aktif ürün", value: activeEntitlementCount, icon: ShieldCheck },
    { label: "Aktif cihaz", value: activeDeviceCount, icon: UserRound },
    {
      label: "İndirme kaydı",
      value: recentDownloadLogs.length,
      icon: KeyRound,
    },
    { label: "İşlem kaydı", value: actionLogs.length, icon: CalendarDays },
  ];

  return (
    <main className="min-h-screen px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <Link
                href="/admin/customers"
                className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
              >
                <ArrowLeft className="size-4" strokeWidth={1.5} />
                Müşteriler
              </Link>
              <div className="mt-5 flex min-w-0 items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-blue-300/10 text-lg font-semibold text-blue-200">
                  {initial}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                      {displayName}
                    </h1>
                    <span className="rounded-md border border-white/[0.1] bg-white/[0.04] px-2 py-1 text-[11px] text-zinc-300">
                      {roleLabel(user.role)}
                    </span>
                    {user.disabledAt ? (
                      <span className="rounded-md border border-red-400/25 bg-red-400/10 px-2 py-1 text-[11px] text-red-300">
                        Devre dışı
                      </span>
                    ) : (
                      <span className="rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-300">
                        Hesap aktif
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex items-center gap-2 truncate text-sm text-zinc-400">
                    <Mail className="size-4 shrink-0" strokeWidth={1.5} />
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[540px]">
              {summaryStats.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/[0.08] bg-black/15 px-3 py-3"
                >
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Icon className="size-4" strokeWidth={1.5} />
                    <span className="text-xs">{label}</span>
                  </div>
                  <p className="mt-2 font-mono text-xl text-white">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 border-t border-white/[0.08] pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-zinc-500">Ad soyad</p>
              <p className="mt-1 text-zinc-200">{user.name ?? "Tanımlı değil"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Personel unvanı</p>
              <p className="mt-1 text-zinc-200">
                {user.staffTitle ?? "Tanımlı değil"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Kayıt tarihi</p>
              <p className="mt-1 font-mono text-xs text-zinc-300">
                {formatDate(user.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Son hesap güncellemesi</p>
              <p className="mt-1 font-mono text-xs text-zinc-300">
                {formatDate(user.updatedAt)}
              </p>
            </div>
          </div>
        </header>

        <div className="mt-6">
          <AdminUserDetailTabs
            userId={user.id}
            products={products}
            entitlements={user.entitlements.map((entitlement) => ({
              id: entitlement.id,
              productName: entitlement.product.name,
              productSlug: entitlement.product.slug,
              status: entitlement.status,
              source: entitlement.source,
              startsAt: formatDate(entitlement.startsAt),
              expiresAt: formatDate(entitlement.expiresAt),
              revokedAt: formatDate(entitlement.revokedAt),
              subscriptionStatus: entitlement.subscription?.status ?? null,
              renewsAt: formatDate(entitlement.subscription?.renewsAt ?? null),
              subscriptionEndsAt: formatDate(
                entitlement.subscription?.endsAt ?? null,
              ),
              trialEndsAt: formatDate(
                entitlement.subscription?.trialEndsAt ?? null,
              ),
            }))}
            devices={user.devices.map((device) => ({
              id: device.id,
              productName: device.product.name,
              deviceName: device.deviceName ?? "-",
              os: device.os ?? "-",
              appVersion: device.appVersion ?? "-",
              launcherVersion: device.launcherVersion ?? "-",
              versionRecordType: device.launcherVersion
                ? "verified-separate"
                : "legacy-ambiguous",
              latestProductVersion: latestFis260Version?.version ?? "-",
              latestLauncherVersion: latestLauncherVersion?.version ?? "-",
              productUpdateAvailable:
                versionIsOlder(
                  device.appVersion,
                  latestFis260Version?.version ?? null,
                ) ?? false,
              launcherUpdateAvailable:
                versionIsOlder(
                  device.launcherVersion,
                  latestLauncherVersion?.version ?? null,
                ) ?? false,
              status: device.status,
              lastSeenAt: formatDate(device.lastSeenAt),
              trustedUntil: formatDate(device.trustedUntil),
              registeredAt: formatDate(device.createdAt),
              revokedAt: formatDate(device.revokedAt),
            }))}
            customerSummary={{
              memberSince: formatDate(membershipStartedAt),
              membershipDuration: membershipDuration(membershipStartedAt),
              subscriptionStatus: activeSubscription?.status ?? "Kayıt yok",
              nextRenewal: formatDate(activeSubscription?.renewsAt ?? null),
              accessEndsAt: formatDate(activeSubscription?.endsAt ?? null),
              paymentCount: paidPayments.length,
              totalPaid: formatMoney(
                totalPaid,
                lastPayment?.currency ?? "TRY",
              ),
              lastPayment: lastPayment
                ? `${formatMoney(lastPayment.amount, lastPayment.currency)} · ${formatDate(lastPayment.paidAt ?? lastPayment.createdAt)}`
                : "Kayıt yok",
              testMode: paidPayments.some((payment) => payment.testMode),
            }}
            downloadLogs={recentDownloadLogs.map((log) => ({
              id: log.id,
              success: log.success,
              reason: log.reason ?? "-",
              createdAt: formatDate(log.createdAt),
            }))}
            actionLogs={actionLogs.map((log) => ({
              id: log.id,
              adminId: log.adminId,
              adminName:
                actionAdminNames.get(log.adminId) ?? "Bilinmeyen personel",
              action: log.action,
              before: log.before,
              after: log.after,
              ipAddress: log.ipAddress ?? "-",
              createdAt: formatDate(log.createdAt),
            }))}
            notes={notes.map((note) => ({
              id: note.id,
              adminId: note.adminId,
              body: note.body,
              createdAt: formatDate(note.createdAt),
            }))}
            diagnostic={{
              productExists: Boolean(fis260Product),
              latestReason: recentDownloadLogs[0]?.reason ?? "Log yok",
              endpoint: `/api/admin/diagnose?userId=${user.id}&productSlug=fis260`,
            }}
          />
        </div>

        {canManageStaff ? (
          <details className="mt-6 rounded-2xl border border-blue-300/15 bg-blue-300/[0.035]">
            <summary className="cursor-pointer list-none px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-medium text-white">
                    Personel yetkileri ve parola yönetimi
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Bu alan yalnızca personel yetkisi veya geçici parola
                    değişikliği gerektiğinde kullanılır.
                  </p>
                </div>
                <span className="shrink-0 text-xs text-blue-200">
                  Ayarları aç
                </span>
              </div>
            </summary>
            <div className="grid gap-6 border-t border-blue-300/10 p-5 lg:grid-cols-[1.3fr_0.7fr] sm:p-6">
              <form action={updateStaffPermissions} className="grid gap-3">
                <input type="hidden" name="userId" value={user.id} />
                <input
                  name="staffTitle"
                  defaultValue={user.staffTitle ?? ""}
                  placeholder="Unvan: Muhasebe, Destek..."
                  className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600"
                />
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {ADMIN_PERMISSIONS.map((permission) => (
                    <label
                      key={permission.key}
                      className="flex items-start gap-2 rounded-lg border border-white/[0.08] bg-[#0c0d10] px-3 py-2 text-sm text-zinc-300"
                    >
                      <input
                        name="permissions"
                        type="checkbox"
                        value={permission.key}
                        defaultChecked={user.staffPermissions.includes(
                          permission.key,
                        )}
                        disabled={
                          user.role === UserRole.OWNER ||
                          user.role === UserRole.ADMIN
                        }
                        className="mt-1 size-4 accent-blue-400"
                      />
                      <span>{permission.label}</span>
                    </label>
                  ))}
                </div>
                <button className="h-11 rounded-lg bg-blue-400 px-5 text-sm font-semibold text-blue-950 transition hover:bg-blue-300">
                  Yetkileri kaydet
                </button>
              </form>

              <form
                action={resetUserPassword}
                className="grid content-start gap-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.035] p-4"
              >
                <input type="hidden" name="userId" value={user.id} />
                <div>
                  <h3 className="font-medium text-white">Geçici parola</h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    Kullanıcı bir sonraki girişinde bu parolayı kullanır.
                  </p>
                </div>
                <input
                  name="password"
                  type="text"
                  minLength={8}
                  placeholder="Yeni geçici parola"
                  className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600"
                />
                <button className="h-11 rounded-lg border border-amber-300/25 bg-amber-300/10 px-5 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/15">
                  Parolayı sıfırla
                </button>
              </form>
            </div>
          </details>
        ) : null}
      </div>
    </main>
  );
}

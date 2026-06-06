import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";

export const metadata: Metadata = {
  title: "Güvenlik | İmleç Yazılım Admin",
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

function ForbiddenView() {
  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-3xl rounded-xl border border-white/[0.08] bg-white/[0.025] p-6">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-red-300">
          Erişim reddedildi
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Bu alan yalnızca admin panel yetkilileri içindir.
        </h1>
      </div>
    </main>
  );
}

const SUSPICIOUS_REASONS = [
  "DEVICE_SHARED_ACROSS_TOO_MANY_ACCOUNTS",
  "DEVICE_REVOKED_REGISTER_ATTEMPT",
  "ENTITLEMENT_INACTIVE_REGISTER_ATTEMPT",
  "DESKTOP_DOWNLOAD_INVALID_TOKEN",
  "DESKTOP_DOWNLOAD_ENTITLEMENT_INVALID",
  "DESKTOP_DOWNLOAD_VERSION_NOT_FOUND",
  "DESKTOP_DOWNLOAD_PRODUCT_NOT_FOUND",
];

export default async function AdminSecurityPage() {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/security");
  }

  if (admin.status === "forbidden") {
    return <ForbiddenView />;
  }

  const [securityLogs, devices] = await Promise.all([
    prisma.downloadLog.findMany({
      where: {
        reason: {
          in: SUSPICIOUS_REASONS,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    }),
    prisma.device.findMany({
      where: {
        revokedAt: null,
      },
      orderBy: {
        lastSeenAt: "desc",
      },
      take: 1000,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        product: {
          select: {
            slug: true,
            name: true,
          },
        },
      },
    }),
  ]);

  const byFingerprint = new Map<string, typeof devices>();
  for (const device of devices) {
    const key = `${device.productId}:${device.fingerprintHash}`;
    const group = byFingerprint.get(key) ?? [];
    group.push(device);
    byFingerprint.set(key, group);
  }

  const sharedDevices = Array.from(byFingerprint.values())
    .map((group) => {
      const userIds = new Set(group.map((device) => device.userId));
      return {
        group,
        userCount: userIds.size,
      };
    })
    .filter((item) => item.userCount > 1)
    .sort((left, right) => right.userCount - left.userCount)
    .slice(0, 30);

  const reasonCounts = securityLogs.reduce<Record<string, number>>((acc, log) => {
    const reason = log.reason ?? "UNKNOWN";
    acc[reason] = (acc[reason] ?? 0) + 1;
    return acc;
  }, {});

  const ipCounts = securityLogs.reduce<Record<string, number>>((acc, log) => {
    const ip = log.ipAddress ?? "Bilinmiyor";
    acc[ip] = (acc[ip] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              ← Admin panel
            </Link>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.24em] text-red-300/80">
              Güvenlik
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Korsan / Şüpheli Kullanım
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-400">
              Cihaz paylaşımı, iptal edilmiş cihaz denemeleri ve yetkisiz
              desktop download denemeleri burada izlenir.
            </p>
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <p className="text-sm text-zinc-500">Şüpheli olay</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {securityLogs.length}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <p className="text-sm text-zinc-500">Paylaşılan cihaz grubu</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {sharedDevices.length}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <p className="text-sm text-zinc-500">Şüpheli IP</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {Object.keys(ipCounts).length}
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <h2 className="text-xl font-semibold tracking-tight">
              Olay türleri
            </h2>
            <div className="mt-4 grid gap-2">
              {Object.entries(reasonCounts).length > 0 ? (
                Object.entries(reasonCounts).map(([reason, count]) => (
                  <div
                    key={reason}
                    className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-[#0c0d10] px-4 py-3 text-sm"
                  >
                    <span className="text-zinc-300">{reason}</span>
                    <span className="font-mono text-red-200">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">Şüpheli olay yok.</p>
              )}
            </div>
          </article>

          <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <h2 className="text-xl font-semibold tracking-tight">
              IP yoğunluğu
            </h2>
            <div className="mt-4 grid gap-2">
              {Object.entries(ipCounts)
                .sort((left, right) => right[1] - left[1])
                .slice(0, 20)
                .map(([ip, count]) => (
                  <div
                    key={ip}
                    className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-[#0c0d10] px-4 py-3 text-sm"
                  >
                    <span className="text-zinc-300">{ip}</span>
                    <span className="font-mono text-red-200">{count}</span>
                  </div>
                ))}
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
          <h2 className="text-xl font-semibold tracking-tight">
            Birden fazla hesapta görünen cihazlar
          </h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-white/[0.07]">
            <div className="grid grid-cols-5 bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <span>Ürün</span>
              <span>Hesap sayısı</span>
              <span>Cihaz</span>
              <span>Kullanıcılar</span>
              <span>Son görülme</span>
            </div>
            {sharedDevices.length > 0 ? (
              sharedDevices.map((item) => {
                const first = item.group[0];
                return (
                  <div
                    key={`${first.productId}:${first.fingerprintHash}`}
                    className="grid grid-cols-5 border-t border-white/[0.07] px-4 py-3 text-sm text-zinc-300"
                  >
                    <span>{first.product.name}</span>
                    <span className="font-mono text-red-200">
                      {item.userCount}
                    </span>
                    <span className="truncate">
                      {first.deviceName ?? "İsimsiz cihaz"}
                    </span>
                    <span className="grid gap-1">
                      {item.group.slice(0, 4).map((device) => (
                        <Link
                          key={device.id}
                          href={`/admin/users/${device.user.id}`}
                          className="truncate text-blue-200 hover:text-blue-100"
                        >
                          {device.user.email}
                        </Link>
                      ))}
                    </span>
                    <span>{formatDate(first.lastSeenAt)}</span>
                  </div>
                );
              })
            ) : (
              <div className="border-t border-white/[0.07] px-4 py-4 text-sm text-zinc-500">
                Birden fazla hesapta aktif görünen cihaz yok.
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
          <h2 className="text-xl font-semibold tracking-tight">
            Son güvenlik olayları
          </h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-white/[0.07]">
            <div className="grid grid-cols-6 bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <span>Tarih</span>
              <span>Kullanıcı</span>
              <span>Ürün</span>
              <span>Olay</span>
              <span>IP</span>
              <span>User-Agent</span>
            </div>
            {securityLogs.length > 0 ? (
              securityLogs.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-6 border-t border-white/[0.07] px-4 py-3 text-sm text-zinc-300"
                >
                  <span>{formatDate(log.createdAt)}</span>
                  <span>
                    {log.userId ? (
                      <Link
                        href={`/admin/users/${log.userId}`}
                        className="text-blue-200 hover:text-blue-100"
                      >
                        Kullanıcı
                      </Link>
                    ) : (
                      "-"
                    )}
                  </span>
                  <span>{log.productSlug}</span>
                  <span className="text-red-200">{log.reason}</span>
                  <span>{log.ipAddress ?? "-"}</span>
                  <span className="truncate">{log.userAgent ?? "-"}</span>
                </div>
              ))
            ) : (
              <div className="border-t border-white/[0.07] px-4 py-4 text-sm text-zinc-500">
                Güvenlik olayı yok.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

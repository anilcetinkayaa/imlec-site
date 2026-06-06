import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";

export const metadata: Metadata = {
  title: "Güvenlik | İmleç Yazılım Admin",
};

const SUSPICIOUS_REASONS = [
  "DEVICE_SHARED_ACROSS_TOO_MANY_ACCOUNTS",
  "DEVICE_REVOKED_REGISTER_ATTEMPT",
  "ENTITLEMENT_INACTIVE_REGISTER_ATTEMPT",
  "DESKTOP_PRODUCTS_DEVICE_REQUIRED",
  "DESKTOP_PRODUCTS_DEVICE_NOT_REGISTERED",
  "DESKTOP_PRODUCTS_DEVICE_REVOKED",
  "DESKTOP_PRODUCTS_DEVICE_LIMIT_REACHED",
  "DESKTOP_PRODUCTS_DEVICE_SHARED_SUSPICIOUS",
  "DESKTOP_PRODUCTS_SESSION_INVALID",
  "DESKTOP_DOWNLOAD_INVALID_TOKEN",
  "DESKTOP_DOWNLOAD_ENTITLEMENT_INVALID",
  "DESKTOP_DOWNLOAD_DEVICE_REQUIRED",
  "DESKTOP_DOWNLOAD_DEVICE_NOT_REGISTERED",
  "DESKTOP_DOWNLOAD_DEVICE_REVOKED",
  "DESKTOP_DOWNLOAD_SESSION_INVALID",
  "DESKTOP_DOWNLOAD_VERSION_NOT_FOUND",
  "DESKTOP_DOWNLOAD_PRODUCT_NOT_FOUND",
];

const REASON_LABELS: Record<string, string> = {
  DEVICE_SHARED_ACROSS_TOO_MANY_ACCOUNTS: "Aynı cihaz çok fazla hesapta kullanıldı",
  DEVICE_REVOKED_REGISTER_ATTEMPT: "Engellenmiş cihaz tekrar bağlanmayı denedi",
  ENTITLEMENT_INACTIVE_REGISTER_ATTEMPT: "Lisansı pasif kullanıcı cihaz kaydı denedi",
  DESKTOP_PRODUCTS_DEVICE_REQUIRED: "Launcher cihaz kimliği göndermedi",
  DESKTOP_PRODUCTS_DEVICE_NOT_REGISTERED: "Ürün listesinde kayıtlı cihaz bulunamadı",
  DESKTOP_PRODUCTS_DEVICE_REVOKED: "Engellenmiş cihaz güncelleme/indirme istedi",
  DESKTOP_PRODUCTS_DEVICE_LIMIT_REACHED: "Cihaz limiti dolduğu için indirme kapatıldı",
  DESKTOP_PRODUCTS_DEVICE_SHARED_SUSPICIOUS: "Aynı cihaz çok fazla farklı hesapta göründü",
  DESKTOP_PRODUCTS_SESSION_INVALID: "Ürün listesinde desktop session geçersiz",
  DESKTOP_DOWNLOAD_INVALID_TOKEN: "İndirme linki geçersiz veya süresi dolmuş",
  DESKTOP_DOWNLOAD_ENTITLEMENT_INVALID: "Lisans pasifken indirme denendi",
  DESKTOP_DOWNLOAD_DEVICE_REQUIRED: "İndirme linkinde cihaz kimliği yok",
  DESKTOP_DOWNLOAD_DEVICE_NOT_REGISTERED: "Kayıtlı olmayan cihaz indirme denedi",
  DESKTOP_DOWNLOAD_DEVICE_REVOKED: "Engellenmiş cihaz indirme denedi",
  DESKTOP_DOWNLOAD_SESSION_INVALID: "İndirme sırasında desktop session geçersiz",
  DESKTOP_DOWNLOAD_VERSION_NOT_FOUND: "İstenen sürüm kaydı bulunamadı",
  DESKTOP_DOWNLOAD_PRODUCT_NOT_FOUND: "İstenen ürün bulunamadı",
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

function riskLevel(count: number) {
  if (count >= 10) {
    return { label: "Yüksek", className: "text-red-200" };
  }
  if (count >= 3) {
    return { label: "Orta", className: "text-amber-200" };
  }
  return { label: "Düşük", className: "text-emerald-200" };
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

export default async function AdminSecurityPage() {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/security");
  }

  if (admin.status === "forbidden") {
    return <ForbiddenView />;
  }

  const [securityLogs, devices, openSupportTickets] = await Promise.all([
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
    prisma.supportTicket.findMany({
      where: {
        status: {
          in: ["OPEN", "IN_PROGRESS"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const logUserIds = Array.from(
    new Set(securityLogs.map((log) => log.userId).filter(Boolean) as string[]),
  );
  const logUsers = logUserIds.length
    ? await prisma.user.findMany({
        where: {
          id: {
            in: logUserIds,
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      })
    : [];
  const logUserById = new Map(logUsers.map((user) => [user.id, user]));

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
      return { group, userCount: userIds.size };
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

  const userRiskCounts = securityLogs.reduce<Record<string, number>>((acc, log) => {
    if (!log.userId) {
      return acc;
    }
    acc[log.userId] = (acc[log.userId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/admin" className="text-sm text-zinc-400 transition hover:text-white">
              ← Admin panel
            </Link>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.24em] text-red-300/80">
              Güvenlik
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Korsan / Şüpheli Kullanım
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-400">
              Cihaz paylaşımı, engellenmiş cihaz denemeleri, yetkisiz download
              girişimleri ve açık müşteri bildirimleri burada izlenir.
            </p>
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <p className="text-sm text-zinc-500">Şüpheli olay</p>
            <p className="mt-2 text-3xl font-semibold text-white">{securityLogs.length}</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <p className="text-sm text-zinc-500">Paylaşılan cihaz grubu</p>
            <p className="mt-2 text-3xl font-semibold text-white">{sharedDevices.length}</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <p className="text-sm text-zinc-500">Şüpheli IP</p>
            <p className="mt-2 text-3xl font-semibold text-white">{Object.keys(ipCounts).length}</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <p className="text-sm text-zinc-500">Açık bildirim</p>
            <p className="mt-2 text-3xl font-semibold text-white">{openSupportTickets.length}</p>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
          <h2 className="text-xl font-semibold tracking-tight">Hızlı müdahale listesi</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Riskli kullanıcıya girerek cihaz engelleme, tüm cihazları kapatma veya
            lisans iptali işlemlerini aynı ekrandan yapabilirsiniz.
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-white/[0.07]">
            <div className="grid grid-cols-5 bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <span>Kullanıcı</span>
              <span>Risk</span>
              <span>Olay</span>
              <span>Son olay</span>
              <span>İşlem</span>
            </div>
            {Object.entries(userRiskCounts).length > 0 ? (
              Object.entries(userRiskCounts)
                .sort((left, right) => right[1] - left[1])
                .slice(0, 20)
                .map(([userId, count]) => {
                  const user = logUserById.get(userId);
                  const latest = securityLogs.find((log) => log.userId === userId);
                  const risk = riskLevel(count);
                  return (
                    <div
                      key={userId}
                      className="grid grid-cols-5 border-t border-white/[0.07] px-4 py-3 text-sm text-zinc-300"
                    >
                      <Link href={`/admin/users/${userId}`} className="truncate text-blue-200 hover:text-blue-100">
                        {user?.email ?? userId}
                      </Link>
                      <span className={risk.className}>{risk.label}</span>
                      <span className="font-mono text-red-200">{count}</span>
                      <span>{latest ? formatDate(latest.createdAt) : "-"}</span>
                      <Link href={`/admin/users/${userId}`} className="text-blue-200 hover:text-blue-100">
                        Kullanıcıyı aç
                      </Link>
                    </div>
                  );
                })
            ) : (
              <div className="border-t border-white/[0.07] px-4 py-4 text-sm text-zinc-500">
                Müdahale gerektiren kullanıcı yok.
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <h2 className="text-xl font-semibold tracking-tight">Olay türleri</h2>
            <div className="mt-4 grid gap-2">
              {Object.entries(reasonCounts).length > 0 ? (
                Object.entries(reasonCounts).map(([reason, count]) => (
                  <div key={reason} className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-[#0c0d10] px-4 py-3 text-sm">
                    <span className="text-zinc-300">{REASON_LABELS[reason] ?? reason}</span>
                    <span className="font-mono text-red-200">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">Şüpheli olay yok.</p>
              )}
            </div>
          </article>

          <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <h2 className="text-xl font-semibold tracking-tight">IP yoğunluğu</h2>
            <div className="mt-4 grid gap-2">
              {Object.entries(ipCounts)
                .sort((left, right) => right[1] - left[1])
                .slice(0, 20)
                .map(([ip, count]) => (
                  <div key={ip} className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-[#0c0d10] px-4 py-3 text-sm">
                    <span className="text-zinc-300">{ip}</span>
                    <span className="font-mono text-red-200">{count}</span>
                  </div>
                ))}
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
          <h2 className="text-xl font-semibold tracking-tight">Birden fazla hesapta görünen cihazlar</h2>
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
                  <div key={`${first.productId}:${first.fingerprintHash}`} className="grid grid-cols-5 border-t border-white/[0.07] px-4 py-3 text-sm text-zinc-300">
                    <span>{first.product.name}</span>
                    <span className="font-mono text-red-200">{item.userCount}</span>
                    <span className="truncate">{first.deviceName ?? "İsimsiz cihaz"}</span>
                    <span className="grid gap-1">
                      {item.group.slice(0, 4).map((device) => (
                        <Link key={device.id} href={`/admin/users/${device.user.id}`} className="truncate text-blue-200 hover:text-blue-100">
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
          <h2 className="text-xl font-semibold tracking-tight">Son güvenlik olayları</h2>
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
                <div key={log.id} className="grid grid-cols-6 border-t border-white/[0.07] px-4 py-3 text-sm text-zinc-300">
                  <span>{formatDate(log.createdAt)}</span>
                  <span>
                    {log.userId ? (
                      <Link href={`/admin/users/${log.userId}`} className="text-blue-200 hover:text-blue-100">
                        {logUserById.get(log.userId)?.email ?? "Kullanıcı"}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </span>
                  <span>{log.productSlug}</span>
                  <span className="text-red-200">{REASON_LABELS[log.reason ?? ""] ?? log.reason}</span>
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

        <section className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
          <h2 className="text-xl font-semibold tracking-tight">Açık müşteri bildirimleri</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Güvenlik veya lisans problemiyle karışabilecek müşteri şikayetlerini
            buradan hızlıca açabilirsiniz.
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-white/[0.07]">
            <div className="grid grid-cols-6 bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <span>Tarih</span>
              <span>Kullanıcı</span>
              <span>Ürün</span>
              <span>Sürüm</span>
              <span>Fiş</span>
              <span>İşlem</span>
            </div>
            {openSupportTickets.length > 0 ? (
              openSupportTickets.map((ticket) => (
                <div key={ticket.id} className="grid grid-cols-6 border-t border-white/[0.07] px-4 py-3 text-sm text-zinc-300">
                  <span>{formatDate(ticket.createdAt)}</span>
                  <Link href={`/admin/users/${ticket.user.id}`} className="truncate text-blue-200 hover:text-blue-100">
                    {ticket.user.email}
                  </Link>
                  <span>{ticket.productSlug}</span>
                  <span className="font-mono">{ticket.appVersion ?? "-"}</span>
                  <span className="truncate">{ticket.sourceFileName ?? "-"}</span>
                  <Link href={`/admin/support/${ticket.id}`} className="text-blue-200 hover:text-blue-100">
                    Bildirimi aç
                  </Link>
                </div>
              ))
            ) : (
              <div className="border-t border-white/[0.07] px-4 py-4 text-sm text-zinc-500">
                Açık müşteri bildirimi yok.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

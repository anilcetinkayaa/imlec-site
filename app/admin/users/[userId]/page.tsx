import type { Metadata } from "next";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";
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

function ForbiddenView() {
  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-10 text-zinc-100">
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
  const [
    user,
    products,
    fis260Product,
    recentDownloadLogs,
    actionLogs,
    notes,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        entitlements: {
          orderBy: { createdAt: "desc" },
          include: {
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
            status: true,
            lastSeenAt: true,
            revokedAt: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
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
  ]);

  if (!user) {
    notFound();
  }

  const canManageStaff =
    admin.session.user.role === UserRole.OWNER ||
    admin.session.user.role === UserRole.ADMIN;

  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              ← Kullanıcılar
            </Link>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Kullanıcı detayı
            </h1>
            <p className="mt-2 text-sm text-zinc-400">{user.email}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="grid gap-6">
            <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
              <h2 className="text-xl font-semibold tracking-tight">
                Temel bilgiler
              </h2>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-zinc-500">Email</p>
                  <p className="mt-1 text-white">{user.email}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Ad</p>
                  <p className="mt-1 text-white">{user.name ?? "-"}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Rol</p>
                  <p className="mt-1 text-white">{roleLabel(user.role)}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Unvan</p>
                  <p className="mt-1 text-white">{user.staffTitle ?? "-"}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Kayıt tarihi</p>
                  <p className="mt-1 text-white">{formatDate(user.createdAt)}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Güncelleme</p>
                  <p className="mt-1 text-white">{formatDate(user.updatedAt)}</p>
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
              <h2 className="text-xl font-semibold tracking-tight">
                Erişimler
              </h2>
              <div className="mt-4 overflow-hidden rounded-lg border border-white/[0.07]">
                <div className="grid grid-cols-6 bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
                  <span>Ürün</span>
                  <span>Slug</span>
                  <span>Status</span>
                  <span>Source</span>
                  <span>Başlangıç</span>
                  <span>Bitiş / revoke</span>
                </div>
                {user.entitlements.length > 0 ? (
                  user.entitlements.map((entitlement) => (
                    <div
                      key={entitlement.id}
                      className="grid grid-cols-6 border-t border-white/[0.07] px-4 py-3 text-sm text-zinc-300"
                    >
                      <span>{entitlement.product.name}</span>
                      <span>{entitlement.product.slug}</span>
                      <span>{entitlement.status}</span>
                      <span>{entitlement.source}</span>
                      <span>{formatDate(entitlement.startsAt)}</span>
                      <span>
                        {formatDate(entitlement.expiresAt)} /{" "}
                        {formatDate(entitlement.revokedAt)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="border-t border-white/[0.07] px-4 py-4 text-sm text-zinc-500">
                    Erişim kaydı yok.
                  </div>
                )}
              </div>
            </article>

            <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
              <h2 className="text-xl font-semibold tracking-tight">
                Cihazlar
              </h2>
              <div className="mt-4 overflow-hidden rounded-lg border border-white/[0.07]">
                <div className="grid grid-cols-7 bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
                  <span>Ürün</span>
                  <span>Cihaz</span>
                  <span>OS</span>
                  <span>Versiyon</span>
                  <span>Status</span>
                  <span>Son aktif</span>
                  <span>Revoked</span>
                </div>
                {user.devices.length > 0 ? (
                  user.devices.map((device) => (
                    <div
                      key={device.id}
                      className="grid grid-cols-7 border-t border-white/[0.07] px-4 py-3 text-sm text-zinc-300"
                    >
                      <span>{device.product.name}</span>
                      <span>{device.deviceName ?? "-"}</span>
                      <span>{device.os ?? "-"}</span>
                      <span>{device.appVersion ?? "-"}</span>
                      <span>{device.status}</span>
                      <span>{formatDate(device.lastSeenAt)}</span>
                      <span>{formatDate(device.revokedAt)}</span>
                    </div>
                  ))
                ) : (
                  <div className="border-t border-white/[0.07] px-4 py-4 text-sm text-zinc-500">
                    Kayıtlı cihaz yok.
                  </div>
                )}
              </div>
            </article>
          </section>

          <aside className="grid gap-5">
            {canManageStaff ? (
              <article className="rounded-xl border border-blue-300/15 bg-blue-300/[0.045] p-5">
                <h2 className="text-xl font-semibold tracking-tight">
                  Yetki ve sifre
                </h2>
                <form action={updateStaffPermissions} className="mt-4 grid gap-3">
                  <input type="hidden" name="userId" value={user.id} />
                  <input
                    name="staffTitle"
                    defaultValue={user.staffTitle ?? ""}
                    placeholder="Unvan: Muhasebe, Destek..."
                    className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600"
                  />
                  <div className="grid gap-2">
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

                <form action={resetUserPassword} className="mt-5 grid gap-3 border-t border-white/[0.08] pt-5">
                  <input type="hidden" name="userId" value={user.id} />
                  <input
                    name="password"
                    type="text"
                    minLength={8}
                    placeholder="Yeni gecici sifre"
                    className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600"
                  />
                  <button className="h-11 rounded-lg border border-amber-300/25 bg-amber-300/10 px-5 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/15">
                    Sifre sifirla
                  </button>
                </form>
              </article>
            ) : null}

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
              }))}
              devices={user.devices.map((device) => ({
                id: device.id,
                productName: device.product.name,
                deviceName: device.deviceName ?? "-",
                os: device.os ?? "-",
                appVersion: device.appVersion ?? "-",
                status: device.status,
                lastSeenAt: formatDate(device.lastSeenAt),
                revokedAt: formatDate(device.revokedAt),
              }))}
              downloadLogs={recentDownloadLogs.map((log) => ({
                id: log.id,
                success: log.success,
                reason: log.reason ?? "-",
                createdAt: formatDate(log.createdAt),
              }))}
              actionLogs={actionLogs.map((log) => ({
                id: log.id,
                adminId: log.adminId,
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
          </aside>
        </div>
      </div>
    </main>
  );
}

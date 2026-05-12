import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";
import { AdminUserActions } from "./admin-user-actions";

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
  const [user, products] = await Promise.all([
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
  ]);

  if (!user) {
    notFound();
  }

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
                  <p className="mt-1 text-white">{user.role}</p>
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

          <AdminUserActions
            userId={user.id}
            products={products}
            entitlements={user.entitlements.map((entitlement) => ({
              id: entitlement.id,
              productName: entitlement.product.name,
              status: entitlement.status,
            }))}
            devices={user.devices.map((device) => ({
              id: device.id,
              productName: device.product.name,
              deviceName: device.deviceName,
              status: device.status,
            }))}
          />
        </div>
      </div>
    </main>
  );
}

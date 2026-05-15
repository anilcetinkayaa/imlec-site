import { EntitlementStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";

export const metadata: Metadata = {
  title: "Admin | İmleç Yazılım",
  description: "İmleç Yazılım kullanıcı ve ürün erişimi yönetimi.",
};

type AdminPageProps = {
  searchParams: Promise<{
    q?: string;
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

function isActiveEntitlement(entitlement: {
  status: EntitlementStatus;
  expiresAt: Date | null;
  revokedAt: Date | null;
}) {
  return (
    entitlement.status === EntitlementStatus.ACTIVE &&
    !entitlement.revokedAt &&
    (!entitlement.expiresAt || entitlement.expiresAt > new Date())
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
          Bu alan yalnızca ADMIN rolü içindir.
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

  const users = await prisma.user.findMany({
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
  });

  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-blue-300/80">
              Admin panel
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Kullanıcılar
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/announcements"
              className="rounded-lg border border-blue-300/20 px-4 py-2 text-sm text-blue-200 transition hover:bg-blue-300/10"
            >
              Duyurular / Yayınlar
            </Link>
            <Link
              href="/admin/lemonsqueezy"
              className="rounded-lg border border-purple-300/20 px-4 py-2 text-sm text-purple-200 transition hover:bg-purple-300/10"
            >
              Lemon Squeezy
            </Link>
            <Link
              href="/account"
              className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05]"
            >
              Üyelik paneli
            </Link>
          </div>
        </div>

        <form className="mt-6 flex flex-col gap-3 sm:flex-row" action="/admin">
          <input
            name="q"
            defaultValue={query}
            placeholder="Email veya ad ile ara"
            className="h-11 flex-1 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-blue-300/50"
          />
          <button className="h-11 rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-950 transition hover:bg-white">
            Ara
          </button>
        </form>

        <section className="mt-6 overflow-hidden rounded-xl border border-white/[0.08]">
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
        </section>
      </div>
    </main>
  );
}

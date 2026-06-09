import { UserRole } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ADMIN_PERMISSIONS,
  roleLabel,
} from "@/src/server/admin-permissions";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";
import {
  resetUserPassword,
  updateStaffPermissions,
} from "./actions";
import { StaffCreateForm } from "./staff-create-form";

export const metadata: Metadata = {
  title: "Personel Yetkileri | Imlec Admin",
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

export default async function AdminUsersPage() {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/users");
  }

  if (admin.status === "forbidden") {
    redirect("/admin");
  }

  const canManageStaff =
    admin.session.user.role === UserRole.OWNER ||
    admin.session.user.role === UserRole.ADMIN;

  const staffUsers = await prisma.user.findMany({
    where: {
      OR: [
        { role: { in: [UserRole.OWNER, UserRole.ADMIN, UserRole.SUPPORT] } },
        { username: { not: null } },
      ],
    },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    take: 120,
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      staffTitle: true,
      staffPermissions: true,
      role: true,
      disabledAt: true,
      createdAt: true,
    },
  });

  const recentActions = await prisma.adminActionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      adminId: true,
      targetUserId: true,
      action: true,
      createdAt: true,
    },
  });

  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-white/[0.08] pb-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-blue-300/80">
            Personel ve yetki yonetimi
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Personel Hesaplari
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            Musteri hesaplarini admin yapmak yerine, ekibiniz icin ayri
            personel hesabi olusturun. Her personele sadece gerekli ekranlari
            checkbox ile verin; yaptigi islemler loglarda saklanir.
          </p>
        </div>

        {canManageStaff ? (
          <StaffCreateForm />
        ) : (
          <div className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-5 text-sm text-amber-100">
            Personel hesabi ve yetki tanimlama yalnizca Firma Sahibi yetkisindeki
            hesaplar tarafindan yapilir.
          </div>
        )}

        <section className="mt-6 grid gap-4">
          {staffUsers.map((user) => (
            <article
              key={user.id}
              className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5"
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold tracking-tight">
                      {user.name ?? user.email}
                    </h2>
                    <span className="rounded-full border border-blue-300/20 bg-blue-300/10 px-2.5 py-1 text-xs text-blue-100">
                      {roleLabel(user.role)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-zinc-400">
                    <span>Kullanici adi: {user.username ?? "-"}</span>
                    <span>Email: {user.email}</span>
                    <span>Unvan: {user.staffTitle ?? "-"}</span>
                    <span>Kayit: {formatDate(user.createdAt)}</span>
                  </div>
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="mt-4 inline-flex rounded-lg border border-white/[0.12] px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.05]"
                  >
                    Detay ve loglari ac
                  </Link>
                </div>

                {canManageStaff ? (
                  <div className="grid gap-4">
                    <form action={updateStaffPermissions} className="grid gap-3">
                      <input type="hidden" name="userId" value={user.id} />
                      <input
                        name="staffTitle"
                        defaultValue={user.staffTitle ?? ""}
                        placeholder="Unvan"
                        className="h-10 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600"
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
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
                              className="mt-1 size-4 accent-blue-400"
                              disabled={
                                user.role === UserRole.OWNER ||
                                user.role === UserRole.ADMIN
                              }
                            />
                            <span>{permission.label}</span>
                          </label>
                        ))}
                      </div>
                      <button className="h-10 rounded-lg border border-blue-300/25 bg-blue-300/10 px-4 text-sm text-blue-100 hover:bg-blue-300/15">
                        Yetkileri kaydet
                      </button>
                    </form>

                    <form action={resetUserPassword} className="grid gap-2 border-t border-white/[0.08] pt-4 sm:grid-cols-[1fr_auto]">
                      <input type="hidden" name="userId" value={user.id} />
                      <input
                        name="password"
                        type="text"
                        minLength={8}
                        placeholder="Yeni gecici sifre"
                        className="h-10 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600"
                      />
                      <button className="h-10 rounded-lg border border-amber-300/25 bg-amber-300/10 px-4 text-sm text-amber-100 hover:bg-amber-300/15">
                        Sifre sifirla
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
          <h2 className="text-xl font-semibold tracking-tight">
            Son personel islemleri
          </h2>
          <div className="mt-4 grid gap-2">
            {recentActions.map((action) => (
              <div
                key={action.id}
                className="grid gap-2 rounded-lg border border-white/[0.07] bg-[#0c0d10] px-4 py-3 text-sm text-zinc-300 md:grid-cols-[1fr_1fr_1fr_1fr]"
              >
                <span>{formatDate(action.createdAt)}</span>
                <span>{action.action}</span>
                <span>Yapan: {action.adminId}</span>
                <span>Hedef: {action.targetUserId ?? "-"}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

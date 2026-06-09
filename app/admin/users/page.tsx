import { UserRole } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";
import {
  createStaffUser,
  resetUserPassword,
  updateUserRoleAndTitle,
} from "./actions";

export const metadata: Metadata = {
  title: "Kullanicilar ve Yetkiler | Imlec Admin",
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

const roleLabels: Record<UserRole, string> = {
  OWNER: "Sahip",
  ADMIN: "Yonetici",
  SUPPORT: "Destek",
  USER: "Kullanici",
};

export default async function AdminUsersPage() {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/users");
  }

  if (admin.status === "forbidden") {
    redirect("/admin");
  }

  const isOwner = admin.session.user.role === UserRole.OWNER;
  const users = await prisma.user.findMany({
    orderBy: [{ role: "desc" }, { createdAt: "desc" }],
    take: 120,
    select: {
      id: true,
      email: true,
      name: true,
      staffTitle: true,
      role: true,
      disabledAt: true,
      createdAt: true,
      _count: {
        select: {
          devices: true,
          entitlements: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-white/[0.08] pb-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-blue-300/80">
            Ekip ve yetki yonetimi
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Kullanicilar ve Yetkiler
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            Test ettireceginiz kisilere hesap acin, rol verin, gorev unvani
            tanimlayin ve gerekirse gecici sifre olusturun.
          </p>
        </div>

        {isOwner ? (
          <section className="mt-6 rounded-xl border border-blue-300/15 bg-blue-300/[0.045] p-5">
            <h2 className="text-xl font-semibold tracking-tight">
              Yetkili hesap olustur
            </h2>
            <form action={createStaffUser} className="mt-4 grid gap-3 lg:grid-cols-5">
              <input
                name="email"
                type="email"
                required
                placeholder="email@firma.com"
                className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600"
              />
              <input
                name="name"
                placeholder="Ad soyad"
                className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600"
              />
              <input
                name="staffTitle"
                placeholder="Unvan: Muhasebe, Destek..."
                className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600"
              />
              <select
                name="role"
                defaultValue={UserRole.SUPPORT}
                className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none"
              >
                {Object.values(UserRole).map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </select>
              <input
                name="password"
                type="text"
                required
                minLength={8}
                placeholder="Gecici sifre"
                className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600"
              />
              <button className="h-11 rounded-lg bg-blue-400 px-5 text-sm font-semibold text-blue-950 transition hover:bg-blue-300 lg:col-span-5">
                Hesabi olustur veya guncelle
              </button>
            </form>
          </section>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-xl border border-white/[0.08]">
          <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr_0.7fr_0.9fr_0.7fr] bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
            <span>Kullanici</span>
            <span>Rol</span>
            <span>Unvan</span>
            <span>Erisim</span>
            <span>Cihaz</span>
            <span>Kayit</span>
            <span>Detay</span>
          </div>
          {users.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr_0.7fr_0.9fr_0.7fr] items-start border-t border-white/[0.07] px-4 py-4 text-sm text-zinc-300"
            >
              <div className="min-w-0">
                <p className="truncate text-white">{user.email}</p>
                <p className="mt-1 truncate text-xs text-zinc-500">
                  {user.name ?? "-"}
                </p>
              </div>
              <span>{roleLabels[user.role]}</span>
              <span>{user.staffTitle ?? "-"}</span>
              <span>{user._count.entitlements}</span>
              <span>{user._count.devices}</span>
              <span>{formatDate(user.createdAt)}</span>
              <Link
                href={`/admin/users/${user.id}`}
                className="text-blue-300 transition hover:text-blue-200"
              >
                Ac
              </Link>

              {isOwner ? (
                <div className="col-span-7 mt-3 grid gap-3 rounded-lg border border-white/[0.07] bg-[#0c0d10] p-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
                  <form action={updateUserRoleAndTitle} className="contents">
                    <input type="hidden" name="userId" value={user.id} />
                    <select
                      name="role"
                      defaultValue={user.role}
                      className="h-10 rounded-lg border border-white/[0.1] bg-[#090b10] px-3 text-sm text-white outline-none"
                    >
                      {Object.values(UserRole).map((role) => (
                        <option key={role} value={role}>
                          {roleLabels[role]}
                        </option>
                      ))}
                    </select>
                    <input
                      name="staffTitle"
                      defaultValue={user.staffTitle ?? ""}
                      placeholder="Unvan"
                      className="h-10 rounded-lg border border-white/[0.1] bg-[#090b10] px-3 text-sm text-white outline-none placeholder:text-zinc-600"
                    />
                    <button className="h-10 rounded-lg border border-blue-300/25 bg-blue-300/10 px-4 text-sm text-blue-100 hover:bg-blue-300/15">
                      Yetkiyi kaydet
                    </button>
                  </form>

                  <form action={resetUserPassword} className="contents">
                    <input type="hidden" name="userId" value={user.id} />
                    <input
                      name="password"
                      type="text"
                      minLength={8}
                      placeholder="Yeni gecici sifre"
                      className="h-10 rounded-lg border border-white/[0.1] bg-[#090b10] px-3 text-sm text-white outline-none placeholder:text-zinc-600"
                    />
                    <button className="h-10 rounded-lg border border-amber-300/25 bg-amber-300/10 px-4 text-sm text-amber-100 hover:bg-amber-300/15">
                      Sifre sifirla
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

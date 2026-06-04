import { MembershipRole } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";

export const metadata: Metadata = {
  title: "Şirketler | İmleç Admin",
  description: "Kurumsal müşteri ve ekip üyeliği yönetimi.",
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

export default async function AdminOrganizationsPage() {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/organizations");
  }

  if (admin.status === "forbidden") {
    redirect("/admin");
  }

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      memberships: {
        where: { removedAt: null },
        include: {
          user: {
            select: { email: true, name: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-300/80">
              Kurumsal yönetim
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Şirketler
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              5 cihazlı şirket paketi, ekip yetkileri ve kurumsal faturalama
              için temel müşteri kaydını buradan yönetin.
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05]"
          >
            Admin ana sayfa
          </Link>
        </div>

        <section className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
          <h2 className="text-2xl font-semibold tracking-tight">
            Şirket oluştur
          </h2>
          <form
            action="/api/admin/organizations/create"
            method="post"
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <label className="grid gap-2 text-sm text-zinc-300">
              Şirket adı
              <input
                name="name"
                required
                placeholder="Örn. ABC Muhasebe Ltd."
                className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-300/50"
              />
            </label>
            <label className="grid gap-2 text-sm text-zinc-300">
              Fatura e-postası
              <input
                name="billingEmail"
                type="email"
                placeholder="finans@example.com"
                className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-300/50"
              />
            </label>
            <div className="md:col-span-2">
              <button className="h-11 rounded-lg bg-cyan-300 px-5 text-sm font-medium text-cyan-950 transition hover:bg-cyan-200">
                Şirketi kaydet
              </button>
            </div>
          </form>
        </section>

        <section className="mt-6 grid gap-4">
          {organizations.length > 0 ? (
            organizations.map((organization) => (
              <div
                key={organization.id}
                className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {organization.name}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Fatura: {organization.billingEmail ?? "-"} · Kayıt:{" "}
                      {formatDate(organization.createdAt)}
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-300/20 px-3 py-1 text-xs text-cyan-200">
                    {organization.memberships.length} üye
                  </span>
                </div>

                <form
                  action="/api/admin/organizations/members/add"
                  method="post"
                  className="mt-5 grid gap-3 md:grid-cols-[1fr_0.7fr_auto]"
                >
                  <input type="hidden" name="organizationId" value={organization.id} />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Üye e-postası"
                    className="h-10 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-300/50"
                  />
                  <select
                    name="role"
                    defaultValue={MembershipRole.MEMBER}
                    className="h-10 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none focus:border-cyan-300/50"
                  >
                    {Object.values(MembershipRole).map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <button className="h-10 rounded-lg border border-cyan-300/30 px-4 text-sm font-medium text-cyan-200 transition hover:bg-cyan-300/10">
                    Üye ekle
                  </button>
                </form>

                <div className="mt-4 grid gap-2">
                  {organization.memberships.length > 0 ? (
                    organization.memberships.map((membership) => (
                      <div
                        key={membership.id}
                        className="grid grid-cols-[1.4fr_0.8fr_0.8fr] rounded-lg border border-white/[0.07] bg-[#0c0d10] px-3 py-2 text-sm text-zinc-300"
                      >
                        <span className="truncate text-white">
                          {membership.user.email}
                        </span>
                        <span>{membership.role}</span>
                        <span>{formatDate(membership.createdAt)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-lg border border-white/[0.07] bg-[#0c0d10] px-3 py-3 text-sm text-zinc-500">
                      Bu şirkete henüz üye eklenmemiş.
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 text-sm text-zinc-500">
              Henüz şirket kaydı yok.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

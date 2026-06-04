import { EntitlementSource } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";

export const metadata: Metadata = {
  title: "Kampanyalar | İmleç Admin",
  description: "Deneme, elde tutma ve telafi kampanyalarını yönetin.",
};

const campaignPresets = [
  {
    code: "TRIAL_7",
    title: "7 gün ücretsiz deneme",
    days: 7,
    description: "Yeni üyeye FIS260 deneme erişimi verir.",
  },
  {
    code: "RETENTION_14",
    title: "14 gün elde tutma",
    days: 14,
    description: "İptal etmek isteyen müşteriye karar süresi verir.",
  },
  {
    code: "RECOVERY_30",
    title: "30 gün telafi",
    days: 30,
    description: "Destek veya hizmet aksaması sonrası iyi niyet uzatmasıdır.",
  },
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

export default async function AdminCampaignsPage() {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/campaigns");
  }

  if (admin.status === "forbidden") {
    redirect("/admin");
  }

  const [products, recentEntitlements, recentCampaignLogs] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.entitlement.findMany({
      where: {
        source: { in: [EntitlementSource.TRIAL, EntitlementSource.MANUAL] },
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: {
        product: { select: { name: true, slug: true } },
        user: { select: { email: true, name: true } },
      },
    }),
    prisma.adminActionLog.findMany({
      where: { action: "CAMPAIGN_GRANT" },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-amber-300/80">
              Müşteri kazanımı
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Kampanyalar
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Deneme, iptal kurtarma ve telafi erişimlerini tek yerden tanımlayın.
              İşlemler entitlement olarak yazılır ve admin loguna düşer.
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05]"
          >
            Admin ana sayfa
          </Link>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {campaignPresets.map((preset) => (
            <div
              key={preset.code}
              className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5"
            >
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-amber-300/80">
                {preset.days} gün
              </p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight">
                {preset.title}
              </h2>
              <p className="mt-2 text-sm text-zinc-400">{preset.description}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
          <h2 className="text-2xl font-semibold tracking-tight">
            Kampanya tanımla
          </h2>
          <form
            action="/api/admin/campaigns/grant"
            method="post"
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <label className="grid gap-2 text-sm text-zinc-300">
              Kullanıcı e-postası
              <input
                name="email"
                type="email"
                required
                placeholder="musteri@example.com"
                className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-300/50"
              />
            </label>
            <label className="grid gap-2 text-sm text-zinc-300">
              Ürün
              <select
                name="productId"
                required
                className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none focus:border-amber-300/50"
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.slug})
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-zinc-300">
              Kampanya tipi
              <select
                name="campaignCode"
                required
                className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none focus:border-amber-300/50"
              >
                {campaignPresets.map((preset) => (
                  <option key={preset.code} value={preset.code}>
                    {preset.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-zinc-300">
              Gün
              <input
                name="days"
                type="number"
                min={1}
                max={365}
                defaultValue={7}
                required
                className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none focus:border-amber-300/50"
              />
            </label>
            <label className="grid gap-2 text-sm text-zinc-300 md:col-span-2">
              Not
              <textarea
                name="reason"
                rows={3}
                placeholder="Örn. İlk görüşme sonrası 7 gün deneme verildi."
                className="rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-300/50"
              />
            </label>
            <div className="md:col-span-2">
              <button className="h-11 rounded-lg bg-amber-300 px-5 text-sm font-medium text-amber-950 transition hover:bg-amber-200">
                Kampanyayı uygula
              </button>
            </div>
          </form>
        </section>

        <section className="mt-6 overflow-hidden rounded-xl border border-white/[0.08]">
          <div className="grid grid-cols-[1.3fr_1fr_0.8fr_0.8fr_1fr] bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
            <span>Kullanıcı</span>
            <span>Ürün</span>
            <span>Kaynak</span>
            <span>Bitiş</span>
            <span>Güncelleme</span>
          </div>
          {recentEntitlements.length > 0 ? (
            recentEntitlements.map((entitlement) => (
              <div
                key={entitlement.id}
                className="grid grid-cols-[1.3fr_1fr_0.8fr_0.8fr_1fr] border-t border-white/[0.07] px-4 py-3 text-sm text-zinc-300"
              >
                <span className="truncate text-white">
                  {entitlement.user.email}
                </span>
                <span>{entitlement.product.name}</span>
                <span>{entitlement.source}</span>
                <span>{formatDate(entitlement.expiresAt)}</span>
                <span>{formatDate(entitlement.updatedAt)}</span>
              </div>
            ))
          ) : (
            <div className="border-t border-white/[0.07] px-4 py-5 text-sm text-zinc-500">
              Henüz deneme veya manuel kampanya yok.
            </div>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
          <h2 className="text-xl font-semibold tracking-tight">
            Son kampanya logları
          </h2>
          <div className="mt-4 grid gap-3">
            {recentCampaignLogs.length > 0 ? (
              recentCampaignLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-white/[0.07] bg-[#0c0d10] px-4 py-3 text-sm text-zinc-300"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-mono text-xs text-amber-200">
                      {log.action}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-xs text-zinc-500">
                    Hedef kullanıcı: {log.targetUserId ?? "-"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">Kampanya logu yok.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

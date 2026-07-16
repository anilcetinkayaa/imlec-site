import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";

export const metadata: Metadata = {
  title: "Sürümler | İmleç Admin",
  description: "FIS260 masaüstü güncelleme paketlerini yönetin.",
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

export default async function AdminVersionsPage() {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/versions");
  }

  if (admin.status === "forbidden") {
    redirect("/admin");
  }

  const [products, versions] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.productVersion.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        product: {
          select: { name: true, slug: true },
        },
      },
    }),
  ]);

  return (
    <main className="min-h-screen px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-emerald-300/80">
              Güncelleme merkezi
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Sürümler
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              FIS260 içindeki Güncelle butonu buradaki son sürüm kaydını okur.
              Paket yolu ve SHA256 değeri release paketiyle bire bir aynı olmalı.
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
            Yeni sürüm yayınla
          </h2>
          <form
            action="/api/admin/versions/create"
            method="post"
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <label className="grid gap-2 text-sm text-zinc-300">
              Ürün
              <select
                name="productId"
                required
                className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none focus:border-emerald-300/50"
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.slug})
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-zinc-300">
              Sürüm
              <input
                name="version"
                required
                placeholder="0.1.1"
                className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-300/50"
              />
            </label>
            <label className="grid gap-2 text-sm text-zinc-300">
              Minimum sürüm
              <input
                name="minimumVersion"
                placeholder="0.1.0"
                className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-300/50"
              />
            </label>
            <label className="grid gap-2 text-sm text-zinc-300">
              ZIP yolu
              <input
                name="filePath"
                required
                placeholder="fis260/FIS260-0.1.1-windows-x64.zip"
                className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-300/50"
              />
            </label>
            <label className="grid gap-2 text-sm text-zinc-300 md:col-span-2">
              SHA256
              <input
                name="sha256"
                required
                minLength={64}
                maxLength={64}
                placeholder="64 karakterlik paket imzası"
                className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 font-mono text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-300/50"
              />
            </label>
            <label className="grid gap-2 text-sm text-zinc-300 md:col-span-2">
              Sürüm notu
              <textarea
                name="releaseNotes"
                rows={4}
                placeholder="Kullanıcıya gösterilecek kısa açıklama"
                className="rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-300/50"
              />
            </label>
            <div className="md:col-span-2">
              <button className="h-11 rounded-lg bg-emerald-400 px-5 text-sm font-medium text-emerald-950 transition hover:bg-emerald-300">
                Sürümü kaydet
              </button>
            </div>
          </form>
        </section>

        <section className="mt-6 overflow-hidden rounded-xl border border-white/[0.08]">
          <div className="grid grid-cols-[0.8fr_0.8fr_0.8fr_1.7fr_1.4fr_1fr] bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
            <span>Ürün</span>
            <span>Sürüm</span>
            <span>Minimum</span>
            <span>Paket</span>
            <span>SHA256</span>
            <span>Tarih</span>
          </div>
          {versions.length > 0 ? (
            versions.map((version) => (
              <div
                key={version.id}
                className="grid grid-cols-[0.8fr_0.8fr_0.8fr_1.7fr_1.4fr_1fr] border-t border-white/[0.07] px-4 py-3 text-sm text-zinc-300"
              >
                <span>{version.product.slug}</span>
                <span className="font-mono text-white">{version.version}</span>
                <span className="font-mono">{version.minimumVersion ?? "-"}</span>
                <span className="truncate">{version.filePath}</span>
                <span className="truncate font-mono text-xs">{version.sha256}</span>
                <span>{formatDate(version.createdAt)}</span>
              </div>
            ))
          ) : (
            <div className="border-t border-white/[0.07] px-4 py-5 text-sm text-zinc-500">
              Henüz sürüm kaydı yok.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

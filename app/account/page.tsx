import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/src/db/prisma";
import { getUserProductAccess } from "@/src/server/entitlements";
import { PRODUCT_DOWNLOADS } from "@/src/server/products";
import { PlatformNav } from "../platform-nav";

export const metadata: Metadata = {
  title: "Üyelik Paneli | İmleç Yazılım",
  description:
    "İmleç Yazılım platformu için ürün erişimleri, ödemeler, faturalar ve cihaz yönetimi paneli.",
};

const menuItems = [
  "Genel Bakış",
  "Ürünlerim",
  "Ödemeler",
  "Faturalar",
  "Cihazlar",
  "Hesap",
];

function formatPaymentAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Tarih yok";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default async function AccountPage() {
  const cookieStore = await cookies();
  const cookieNames = cookieStore.getAll().map((cookie) => cookie.name);
  const authCookieNames = cookieNames.filter((name) =>
    name.includes("authjs."),
  );
  const session = await auth();

  console.log("[AUTH DEBUG] account auth cookies:", authCookieNames);
  console.log("[AUTH DEBUG] account session exists:", !!session?.user);
  console.log("[AUTH DEBUG] account session user id:", session?.user?.id);
  console.log("[AUTH DEBUG] account session user email:", session?.user?.email);

  if (!session?.user) {
    redirect("/login");
  }

  const [products, latestPayment, devices, invoices] = await Promise.all([
    getUserProductAccess(session.user.id),
    prisma.payment.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.device.findMany({
      where: {
        userId: session.user.id,
        revokedAt: null,
      },
      orderBy: {
        lastSeenAt: "desc",
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.invoice.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
      take: 3,
    }),
  ]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#08090b] text-zinc-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.12),transparent_58%)]" />

      <PlatformNav compact />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 sm:px-8 lg:px-10">
        <section className="py-10">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-blue-300/80">
            Platform hesabı
          </p>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Üyelik Paneli
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                Ürün erişimlerinizi, ödemelerinizi, faturalarınızı ve kayıtlı
                cihazlarınızı tek platform hesabı üzerinden izleyin.
              </p>
            </div>

            <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm text-zinc-400">
              {session.user.email}
            </div>
          </div>
        </section>

        <div className="grid flex-1 gap-6 border-t border-white/[0.08] py-6 lg:grid-cols-[240px_1fr]">
          <aside className="lg:border-r lg:border-white/[0.08] lg:pr-6">
            <div className="grid gap-1 sm:grid-cols-3 lg:grid-cols-1">
              {menuItems.map((item, index) => (
                <button
                  key={item}
                  className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                    index === 0
                      ? "bg-white/[0.06] text-white"
                      : "text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </aside>

          <section className="grid gap-4">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <article id="products" className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.22em] text-blue-300/75">
                      Aktif ürünler
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                      Ürün erişimleri
                    </h2>
                  </div>
                  <span className="rounded-md border border-white/[0.08] px-2.5 py-1 font-mono text-[11px] text-zinc-500">
                    DB kaynaklı
                  </span>
                </div>

                <div className="mt-6 grid gap-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-[#0c0d10] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            product.hasAccess
                              ? "bg-emerald-400"
                              : "bg-zinc-600"
                          }`}
                        />
                        <span className="font-medium text-white">
                          {product.name}
                        </span>
                      </div>
                      <span
                        className={`text-sm ${
                          product.hasAccess
                            ? "text-emerald-300"
                            : "text-zinc-500"
                        }`}
                      >
                        {product.hasAccess ? "Aktif" : "Erişim yok"}
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-6">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-blue-300/75">
                  Son ödeme
                </p>
                {latestPayment ? (
                  <>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                      {latestPayment.product.name}
                    </h2>
                    <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
                      {formatPaymentAmount(
                        latestPayment.amount,
                        latestPayment.currency,
                      )}
                    </p>
                    <p className="mt-4 text-sm leading-6 text-zinc-400">
                      {formatDate(latestPayment.paidAt)} tarihinde işlendi.
                    </p>
                  </>
                ) : (
                  <p className="mt-5 text-sm leading-6 text-zinc-500">
                    Henüz ödeme kaydı yok. Lemon Squeezy entegrasyonu
                    bağlandığında burada görünecek.
                  </p>
                )}
              </article>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <article id="devices" className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-6">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-blue-300/75">
                  Aktif cihazlar
                </p>
                <div className="mt-5 grid gap-3">
                  {devices.length > 0 ? (
                    devices.map((device) => (
                      <div
                        key={device.id}
                        className="rounded-lg border border-white/[0.07] bg-[#0c0d10] px-4 py-3"
                      >
                        <p className="text-sm font-medium text-white">
                          {device.deviceName ?? "İsimsiz cihaz"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {device.product.name} · Son doğrulama:{" "}
                          {formatDate(device.lastSeenAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-white/[0.07] bg-[#0c0d10] px-4 py-3 text-sm text-zinc-500">
                      Kayıtlı cihaz yok.
                    </div>
                  )}
                </div>
              </article>

              <article className="rounded-xl border border-blue-400/20 bg-blue-400/[0.055] p-6 shadow-[0_0_40px_rgba(59,130,246,0.08)]">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-blue-300/75">
                  İndirilebilir uygulamalar
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  Uygulama indir
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Yetkili ürünleriniz için Windows installer dosyaları burada
                  görünür. FİŞ260 installer gerçek download akışına bağlıdır.
                </p>
                <div className="mt-5 grid gap-3">
                  {products.map((product) =>
                    product.hasAccess ? (
                      <a
                        key={product.id}
                        href={
                          product.slug === "fis260"
                            ? "/api/downloads/fis260"
                            : "#"
                        }
                        className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-950 transition hover:bg-white"
                      >
                        {PRODUCT_DOWNLOADS[product.slug] ??
                          `${product.name} indir`}
                      </a>
                    ) : (
                      <div
                        key={product.id}
                        className="rounded-lg border border-white/[0.07] bg-[#0c0d10] px-4 py-3 text-sm text-zinc-500"
                      >
                        {product.name} erişiminiz yok
                      </div>
                    ),
                  )}
                </div>
              </article>

              <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-6">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-blue-300/75">
                  Hesap bilgileri
                </p>
                <div className="mt-5 grid gap-4 text-sm">
                  <div>
                    <p className="text-zinc-500">Ad soyad</p>
                    <p className="mt-1 font-medium text-white">
                      {session.user.name ?? "İmleç kullanıcısı"}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Mail</p>
                    <p className="mt-1 font-medium text-white">
                      {session.user.email}
                    </p>
                  </div>
                  <button className="mt-1 inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.03] px-4 text-sm font-medium text-zinc-100 transition hover:border-white/[0.22] hover:bg-white/[0.06]">
                    Şifre değiştir
                  </button>
                </div>
              </article>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <article id="payments" className="rounded-xl border border-white/[0.08] bg-white/[0.018] p-6">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Ödeme geçmişi
                </p>
                <div className="mt-5 overflow-hidden rounded-lg border border-white/[0.07]">
                  <div className="grid grid-cols-4 bg-white/[0.03] px-4 py-3 text-xs text-zinc-500">
                    <span>Tarih</span>
                    <span>Ürün</span>
                    <span>Tutar</span>
                    <span>Durum</span>
                  </div>
                  {latestPayment ? (
                    <div className="grid grid-cols-4 px-4 py-3 text-sm text-zinc-300">
                      <span>{formatDate(latestPayment.paidAt)}</span>
                      <span>{latestPayment.product.name}</span>
                      <span>
                        {formatPaymentAmount(
                          latestPayment.amount,
                          latestPayment.currency,
                        )}
                      </span>
                      <span className="text-emerald-300">
                        {latestPayment.status}
                      </span>
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-zinc-500">
                      Henüz ödeme kaydı yok.
                    </div>
                  )}
                </div>
              </article>

              <article className="rounded-xl border border-white/[0.08] bg-white/[0.018] p-6">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Faturalar
                </p>
                <div className="mt-5 grid gap-3">
                  {invoices.length > 0 ? (
                    invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex flex-col gap-3 rounded-lg border border-white/[0.07] bg-[#0c0d10] p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">
                            {invoice.product.name} · {formatDate(invoice.issuedAt)}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {invoice.provider} faturası
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {invoice.invoiceUrl ? (
                            <a
                              href={invoice.invoiceUrl}
                              className="rounded-lg border border-white/[0.12] px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.05]"
                            >
                              Görüntüle
                            </a>
                          ) : null}
                          {invoice.downloadUrl ? (
                            <a
                              href={invoice.downloadUrl}
                              className="rounded-lg border border-white/[0.12] px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.05]"
                            >
                              İndir
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-white/[0.07] bg-[#0c0d10] px-4 py-3 text-sm text-zinc-500">
                      Henüz fatura kaydı yok.
                    </div>
                  )}
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

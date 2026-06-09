import {
  BillingRequestReason,
  BillingRequestType,
  BillingProfileStatus,
  PaymentStatus,
} from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";

export const metadata: Metadata = {
  title: "Muhasebe | İmleç Yazılım Admin",
  description: "Ödeme, fatura ve muhasebe aktarım iş akışı.",
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

function formatMoney(cents: number, currency = "TRY") {
  return (cents / 100).toLocaleString("tr-TR", {
    style: "currency",
    currency,
  });
}

function monthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function statusLabel(status: BillingProfileStatus | null | undefined) {
  switch (status) {
    case BillingProfileStatus.COMPLETE:
      return "Hazır";
    case BillingProfileStatus.NEEDS_REVIEW:
      return "Kontrol gerekli";
    case BillingProfileStatus.MISSING_INFO:
      return "Bilgi eksik";
    default:
      return "Profil yok";
  }
}

const requestTypeLabels: Record<BillingRequestType, string> = {
  CANCEL_TRIAL: "Deneme iptali",
  CANCEL_SUBSCRIPTION: "Abonelik iptali",
  REFUND: "İade talebi",
};

const requestReasonLabels: Record<BillingRequestReason, string> = {
  TRIAL_NOT_NEEDED: "İhtiyacım kalmadı",
  PRICE_TOO_HIGH: "Fiyat uygun değil",
  OCR_NOT_ENOUGH: "OCR sonucu yeterli değil",
  TECHNICAL_PROBLEM: "Teknik sorun",
  BOUGHT_BY_MISTAKE: "Yanlışlıkla satın aldım",
  DUPLICATE_PAYMENT: "Çift ödeme",
  CUSTOMER_SERVICE: "Destek/iletişim",
  OTHER: "Diğer",
};

function billingRequestStatusLabel(status: string) {
  switch (status) {
    case "OPEN":
      return "Yeni";
    case "REVIEWING":
      return "İnceleniyor";
    case "APPROVED":
      return "Onaylandı";
    case "REJECTED":
      return "Reddedildi";
    case "COMPLETED":
      return "Tamamlandı";
    default:
      return status;
  }
}

export default async function AdminAccountingPage() {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/accounting");
  }

  if (admin.status === "forbidden") {
    redirect("/admin");
  }

  const [
    paidThisMonth,
    invoiceWaitingPayments,
    missingBillingProfiles,
    refundedPayments,
    billingRequests,
    recentInvoices,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        status: PaymentStatus.PAID,
        paidAt: {
          gte: monthStart(),
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    }),
    prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        invoices: {
          none: {},
        },
      },
      orderBy: {
        paidAt: "desc",
      },
      take: 50,
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        product: {
          select: {
            name: true,
          },
        },
        billingProfile: true,
      },
    }),
    prisma.billingProfile.findMany({
      where: {
        status: {
          in: [
            BillingProfileStatus.MISSING_INFO,
            BillingProfileStatus.NEEDS_REVIEW,
          ],
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 30,
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    }),
    prisma.payment.findMany({
      where: {
        status: PaymentStatus.REFUNDED,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      include: {
        user: {
          select: {
            email: true,
          },
        },
        product: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.billingRequest.findMany({
      where: {
        status: {
          in: ["OPEN", "REVIEWING"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        product: {
          select: {
            name: true,
          },
        },
        payment: {
          select: {
            amount: true,
            currency: true,
          },
        },
      },
    }),
    prisma.invoice.findMany({
      orderBy: {
        issuedAt: "desc",
      },
      take: 20,
      include: {
        user: {
          select: {
            email: true,
          },
        },
        product: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const waitingCount = invoiceWaitingPayments.length;
  const missingCount = missingBillingProfiles.length;
  const openBillingRequestCount = billingRequests.length;

  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/admin" className="text-sm text-zinc-400 transition hover:text-white">
              ← Yönetim Merkezi
            </Link>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.24em] text-emerald-300/80">
              Muhasebe
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Fatura ve ödeme iş akışı
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              Lemon Squeezy ödemelerini, eksik fatura bilgilerini ve muhasebeciye
              aktarılacak kayıtları tek ekranda takip edin.
            </p>
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-5">
            <p className="text-sm text-zinc-400">Bu ay tahsilat</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {formatMoney(paidThisMonth._sum.amount ?? 0)}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              {paidThisMonth._count} ödeme kaydı.
            </p>
          </div>
          <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-5">
            <p className="text-sm text-zinc-400">Fatura bekleyen</p>
            <p className="mt-2 text-3xl font-semibold text-white">{waitingCount}</p>
            <p className="mt-2 text-xs text-zinc-500">
              Faturaya bağlanmamış ödeme.
            </p>
          </div>
          <div className="rounded-xl border border-red-300/20 bg-red-300/[0.06] p-5">
            <p className="text-sm text-zinc-400">Eksik bilgi</p>
            <p className="mt-2 text-3xl font-semibold text-white">{missingCount}</p>
            <p className="mt-2 text-xs text-zinc-500">
              Fatura profili tamamlanmalı.
            </p>
          </div>
          <div className="rounded-xl border border-purple-300/20 bg-purple-300/[0.06] p-5">
            <p className="text-sm text-zinc-400">Açık iptal/iade</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {openBillingRequestCount}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Müşteri talebi incelenmeli.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-purple-300/20 bg-purple-300/[0.035] p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-purple-200/80">
                Müşteri talebi
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Açık iptal ve iade talepleri
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-zinc-400">
                Deneme iptali, abonelik iptali ve iade istekleri burada görünür.
                İşlem Lemon panelinde tamamlandığında durum güncelleme ekranı eklenebilir.
              </p>
            </div>
            <span className="rounded-lg border border-purple-300/25 bg-purple-300/10 px-3 py-2 text-sm text-purple-100">
              {openBillingRequestCount} açık talep
            </span>
          </div>
          <div className="mt-5 overflow-hidden rounded-lg border border-white/[0.07]">
            <div className="grid grid-cols-[0.9fr_1.1fr_0.9fr_0.9fr_0.9fr_1.4fr] bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <span>Tarih</span>
              <span>Kullanıcı</span>
              <span>Tür</span>
              <span>Neden</span>
              <span>Durum</span>
              <span>Açıklama</span>
            </div>
            {billingRequests.length > 0 ? (
              billingRequests.map((request) => (
                <div
                  key={request.id}
                  className="grid grid-cols-[0.9fr_1.1fr_0.9fr_0.9fr_0.9fr_1.4fr] border-t border-white/[0.07] px-4 py-3 text-sm text-zinc-300"
                >
                  <span>{formatDate(request.createdAt)}</span>
                  <span className="truncate text-white">{request.user.email}</span>
                  <span>{requestTypeLabels[request.type]}</span>
                  <span>{requestReasonLabels[request.reason]}</span>
                  <span>{billingRequestStatusLabel(request.status)}</span>
                  <span className="truncate text-zinc-500">
                    {request.message ??
                      (request.payment
                        ? formatMoney(request.payment.amount, request.payment.currency)
                        : request.product.name)}
                  </span>
                </div>
              ))
            ) : (
              <div className="border-t border-white/[0.07] px-4 py-5 text-sm text-zinc-500">
                Açık iptal veya iade talebi yok.
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-amber-300/80">
                İş kuyruğu
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Fatura bekleyen ödemeler
              </h2>
            </div>
            <button className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
              CSV/XLSX dışa aktarım yakında
            </button>
          </div>
          <div className="mt-5 overflow-hidden rounded-lg border border-white/[0.07]">
            <div className="grid grid-cols-[1fr_1.2fr_0.8fr_0.8fr_1fr_0.8fr] bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <span>Tarih</span>
              <span>Kullanıcı</span>
              <span>Ürün</span>
              <span>Tutar</span>
              <span>Fatura bilgisi</span>
              <span>Provider</span>
            </div>
            {invoiceWaitingPayments.length > 0 ? (
              invoiceWaitingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="grid grid-cols-[1fr_1.2fr_0.8fr_0.8fr_1fr_0.8fr] border-t border-white/[0.07] px-4 py-3 text-sm text-zinc-300"
                >
                  <span>{formatDate(payment.paidAt ?? payment.createdAt)}</span>
                  <span className="truncate text-white">{payment.user.email}</span>
                  <span>{payment.product.name}</span>
                  <span>{formatMoney(payment.amount, payment.currency)}</span>
                  <span>{statusLabel(payment.billingProfile?.status)}</span>
                  <span className="truncate font-mono text-xs">
                    {payment.providerOrderId}
                  </span>
                </div>
              ))
            ) : (
              <div className="border-t border-white/[0.07] px-4 py-5 text-sm text-zinc-500">
                Fatura bekleyen ödeme yok.
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <h2 className="text-xl font-semibold tracking-tight">
              Eksik fatura bilgileri
            </h2>
            <div className="mt-4 grid gap-3">
              {missingBillingProfiles.length > 0 ? (
                missingBillingProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="rounded-lg border border-white/[0.07] bg-[#0c0d10] p-4 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-white">{profile.user.email}</p>
                        <p className="mt-1 text-zinc-500">
                          {profile.type === "COMPANY"
                            ? profile.companyTitle ?? "Şirket unvanı eksik"
                            : profile.fullName ?? "Ad soyad eksik"}
                        </p>
                      </div>
                      <span className="text-amber-200">
                        {statusLabel(profile.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">
                      VKN/TCKN: {profile.vkn ?? profile.tckn ?? "-"} · Vergi
                      dairesi: {profile.taxOffice ?? "-"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">Eksik fatura bilgisi yok.</p>
              )}
            </div>
          </article>

          <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <h2 className="text-xl font-semibold tracking-tight">İade/iptal takibi</h2>
            <div className="mt-4 grid gap-3">
              {refundedPayments.length > 0 ? (
                refundedPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-lg border border-white/[0.07] bg-[#0c0d10] p-4 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-white">{payment.user.email}</p>
                        <p className="mt-1 text-zinc-500">{payment.product.name}</p>
                      </div>
                      <span className="text-red-200">
                        {formatMoney(payment.amount, payment.currency)}
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-xs text-zinc-500">
                      {payment.providerOrderId}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">İade/iptal kaydı yok.</p>
              )}
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
          <h2 className="text-xl font-semibold tracking-tight">Kesilen faturalar</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-white/[0.07]">
            <div className="grid grid-cols-[1fr_1.2fr_0.9fr_1fr_1fr] bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <span>Tarih</span>
              <span>Kullanıcı</span>
              <span>Ürün</span>
              <span>Fatura no</span>
              <span>Dosya</span>
            </div>
            {recentInvoices.length > 0 ? (
              recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="grid grid-cols-[1fr_1.2fr_0.9fr_1fr_1fr] border-t border-white/[0.07] px-4 py-3 text-sm text-zinc-300"
                >
                  <span>{formatDate(invoice.issuedAt ?? invoice.createdAt)}</span>
                  <span className="truncate text-white">{invoice.user.email}</span>
                  <span>{invoice.product.name}</span>
                  <span className="font-mono text-xs">{invoice.providerInvoiceId}</span>
                  <span className="truncate">
                    {invoice.invoiceUrl || invoice.downloadUrl || "-"}
                  </span>
                </div>
              ))
            ) : (
              <div className="border-t border-white/[0.07] px-4 py-5 text-sm text-zinc-500">
                Henüz fatura kaydı yok.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

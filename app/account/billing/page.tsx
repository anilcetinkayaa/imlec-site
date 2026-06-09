import {
  BillingRequestReason,
  BillingRequestType,
  PaymentStatus,
} from "@prisma/client";
import type { Metadata } from "next";
import { auth } from "@/auth";
import {
  AccountPageHeader,
  BillingTable,
  formatDate,
  formatPaymentAmount,
} from "@/app/account/account-ui";
import { createBillingRequest } from "@/app/account/billing/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/src/db/prisma";

export const metadata: Metadata = {
  title: "Ödemeler | İmleç Yazılım",
  description: "İmleç Yazılım ödeme, fatura, iptal ve iade talepleri.",
};

type AccountBillingPageProps = {
  searchParams: Promise<{
    billingRequest?: string;
  }>;
};

const reasonLabels: Record<BillingRequestReason, string> = {
  TRIAL_NOT_NEEDED: "Deneme sürecinde ürüne ihtiyacım kalmadı",
  PRICE_TOO_HIGH: "Fiyat benim için uygun değil",
  OCR_NOT_ENOUGH: "Fiş okuma sonucu beklentimi karşılamadı",
  TECHNICAL_PROBLEM: "Teknik sorun yaşadım",
  BOUGHT_BY_MISTAKE: "Yanlışlıkla satın aldım",
  DUPLICATE_PAYMENT: "Çift/tekrarlı ödeme görünüyor",
  CUSTOMER_SERVICE: "Destek veya iletişim nedeniyle",
  OTHER: "Diğer",
};

const requestTypeLabels: Record<BillingRequestType, string> = {
  CANCEL_TRIAL: "Deneme süresini iptal et",
  CANCEL_SUBSCRIPTION: "Aboneliği iptal et",
  REFUND: "İade talep et",
};

function requestStatusLabel(status: string) {
  switch (status) {
    case "OPEN":
      return "Alındı";
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

export default async function AccountBillingPage({
  searchParams,
}: AccountBillingPageProps) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user?.id) {
    return null;
  }

  const [payments, invoices, subscriptions, products, billingRequests] =
    await Promise.all([
      prisma.payment.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          product: {
            select: {
              id: true,
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
      }),
      prisma.subscription.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
        },
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
        },
      }),
      prisma.billingRequest.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
        include: {
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
    ]);

  const paidPayments = payments.filter(
    (payment) => payment.status === PaymentStatus.PAID,
  );
  const defaultProductId =
    subscriptions[0]?.product.id ?? payments[0]?.product.id ?? products[0]?.id;

  return (
    <>
      <AccountPageHeader
        description="Ödeme, fatura, iptal ve iade taleplerinizi tek yerden takip edin. Deneme süresinde para çekilmeden önce iptal talebi oluşturabilir, ödeme sonrası iade isteyebilirsiniz."
        eyebrow="Ödemeler"
        title="Faturalandırma ve talepler"
      />

      {params.billingRequest === "sent" ? (
        <Card className="mb-5 border-emerald-300/25 bg-emerald-300/[0.06] p-5" variant="default">
          <Badge variant="active">Talep alındı</Badge>
          <p className="text-body-s mt-3 text-[var(--text-secondary)]">
            Talebiniz bize ulaştı. Durumunu bu sayfadaki talep geçmişinden takip edebilirsiniz.
          </p>
        </Card>
      ) : null}

      <Card className="mb-5 p-5" variant="default">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div>
            <Badge variant="beta">Müşteri koruması</Badge>
            <h2 className="text-h3 mt-4">İptal veya iade talebi oluşturun</h2>
            <p className="text-body-s mt-3 text-[var(--text-secondary)]">
              Deneme sürecinde memnun kalmadıysanız para çekilmeden iptal talebi
              oluşturabilirsiniz. Ödeme alındıysa iade talebi gönderebilirsiniz.
              Gerekçeniz ürün geliştirme ve destek sürecimiz için ayrıca kaydedilir.
            </p>
          </div>

          <form action={createBillingRequest} className="grid gap-3">
            <label className="grid gap-2 text-body-s text-[var(--text-secondary)]">
              Talep türü
              <select
                name="type"
                required
                className="h-11 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-[var(--text-primary)] outline-none"
              >
                {Object.values(BillingRequestType).map((type) => (
                  <option key={type} value={type}>
                    {requestTypeLabels[type]}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-body-s text-[var(--text-secondary)]">
              Ürün
              <select
                name="productId"
                required
                defaultValue={defaultProductId}
                className="h-11 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-[var(--text-primary)] outline-none"
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-body-s text-[var(--text-secondary)]">
              İlgili abonelik
              <select
                name="subscriptionId"
                className="h-11 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-[var(--text-primary)] outline-none"
              >
                <option value="">Abonelik seçmeden devam et</option>
                {subscriptions.map((subscription) => (
                  <option key={subscription.id} value={subscription.id}>
                    {subscription.product.name} · {subscription.status} · {formatDate(subscription.renewsAt)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-body-s text-[var(--text-secondary)]">
              İlgili ödeme
              <select
                name="paymentId"
                className="h-11 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-[var(--text-primary)] outline-none"
              >
                <option value="">Ödeme seçmeden devam et</option>
                {paidPayments.map((payment) => (
                  <option key={payment.id} value={payment.id}>
                    {payment.product.name} · {formatPaymentAmount(payment.amount, payment.currency)} · {formatDate(payment.paidAt ?? payment.createdAt)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-body-s text-[var(--text-secondary)]">
              Neden
              <select
                name="reason"
                required
                className="h-11 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-[var(--text-primary)] outline-none"
              >
                {Object.values(BillingRequestReason).map((reason) => (
                  <option key={reason} value={reason}>
                    {reasonLabels[reason]}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-body-s text-[var(--text-secondary)]">
              Açıklama
              <textarea
                name="message"
                rows={4}
                placeholder="İsterseniz birkaç cümleyle durumu anlatın. Örn. Deneme sürecinde ihtiyacım kalmadı veya toplam sonuçları beklentimi karşılamadı."
                className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-3 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </label>

            <Button type="submit">Talebi gönder</Button>
          </form>
        </div>
      </Card>

      <Card className="mb-5 overflow-hidden" variant="default">
        <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3">
          <h2 className="text-body-s font-medium">Talep geçmişi</h2>
        </div>
        {billingRequests.length > 0 ? (
          billingRequests.map((request) => (
            <div
              key={request.id}
              className="grid gap-3 border-b border-[var(--border-subtle)] px-4 py-3 text-body-s last:border-b-0 md:grid-cols-[1fr_1fr_0.8fr_1fr]"
            >
              <span>
                <span className="block text-[var(--text-primary)]">
                  {requestTypeLabels[request.type]}
                </span>
                <span className="text-mono text-[var(--text-tertiary)]">
                  {formatDate(request.createdAt)}
                </span>
              </span>
              <span className="text-[var(--text-secondary)]">
                {request.product.name}
              </span>
              <span>{requestStatusLabel(request.status)}</span>
              <span className="text-[var(--text-tertiary)]">
                {request.payment
                  ? formatPaymentAmount(request.payment.amount, request.payment.currency)
                  : reasonLabels[request.reason]}
              </span>
            </div>
          ))
        ) : (
          <div className="px-4 py-5 text-body-s text-[var(--text-tertiary)]">
            Henüz iptal veya iade talebiniz yok.
          </div>
        )}
      </Card>

      <BillingTable invoices={invoices} payments={payments} />
    </>
  );
}

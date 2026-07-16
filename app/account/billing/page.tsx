import {
  BillingRequestReason,
  BillingRequestType,
  PaymentStatus,
  SubscriptionStatus,
} from "@prisma/client";
import type { Metadata } from "next";
import { auth } from "@/auth";
import {
  AccountPageHeader,
  BillingTable,
  formatDate,
  formatPaymentAmount,
} from "@/app/account/account-ui";
import {
  cancelSubscriptionNow,
  createBillingRequest,
} from "@/app/account/billing/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/src/db/prisma";

export const metadata: Metadata = {
  title: "Odemeler | Imlec Yazilim",
  description: "Imlec Yazilim odeme, fatura, iptal ve iade talepleri.",
};

type AccountBillingPageProps = {
  searchParams: Promise<{
    billingRequest?: string;
  }>;
};

const reasonLabels: Record<BillingRequestReason, string> = {
  TRIAL_NOT_NEEDED: "Deneme surecinde urune ihtiyacim kalmadi",
  PRICE_TOO_HIGH: "Fiyat benim icin uygun degil",
  OCR_NOT_ENOUGH: "Fis okuma sonucu beklentimi karsilamadi",
  TECHNICAL_PROBLEM: "Teknik sorun yasadim",
  BOUGHT_BY_MISTAKE: "Yanlislikla satin aldim",
  DUPLICATE_PAYMENT: "Cift/tekrarli odeme gorunuyor",
  CUSTOMER_SERVICE: "Destek veya iletisim nedeniyle",
  OTHER: "Diger",
};

const requestTypeLabels: Record<BillingRequestType, string> = {
  CANCEL_TRIAL: "Deneme iptali",
  CANCEL_SUBSCRIPTION: "Abonelik iptali",
  REFUND: "Iade talebi",
};

const cancellableStatuses: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.PAST_DUE,
];

function requestStatusLabel(status: string) {
  switch (status) {
    case "OPEN":
      return "Alindi";
    case "REVIEWING":
      return "Inceleniyor";
    case "APPROVED":
      return "Onaylandi";
    case "REJECTED":
      return "Reddedildi";
    case "COMPLETED":
      return "Tamamlandi";
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
  const cancellableSubscriptions = subscriptions.filter((subscription) =>
    cancellableStatuses.includes(subscription.status),
  );
  const defaultProductId =
    subscriptions[0]?.product.id ?? payments[0]?.product.id ?? products[0]?.id;

  return (
    <>
      <AccountPageHeader
        description="Odeme, fatura, iptal ve iade islemlerinizi tek yerden takip edin. Iptal islemi aninda uygulanir; iade talepleri incelemeye alinir."
        eyebrow="Odemeler"
        title="Faturalandirma ve talepler"
      />

      {params.billingRequest === "sent" ? (
        <Card
          className="mb-5 border-emerald-300/25 bg-emerald-300/[0.06] p-5"
          variant="default"
        >
          <Badge variant="active">Iade talebi alindi</Badge>
          <p className="text-body-s mt-3 text-[var(--text-secondary)]">
            Talebiniz bize ulasti. Durumunu bu sayfadaki talep gecmisinden takip
            edebilirsiniz.
          </p>
        </Card>
      ) : null}

      {params.billingRequest === "canceled" ||
      params.billingRequest === "canceled_period" ? (
        <Card
          className="mb-5 border-emerald-300/25 bg-emerald-300/[0.06] p-5"
          variant="default"
        >
          <Badge variant="active">Iptal tamamlandi</Badge>
          <p className="text-body-s mt-3 text-[var(--text-secondary)]">
            {params.billingRequest === "canceled_period"
              ? "Aboneliğiniz Lemon Squeezy üzerinde iptal edildi. Sağlayıcının bildirdiği dönem sonuna kadar erişiminiz korunur; otomatik yenileme yapılmaz."
              : "Deneme veya abonelik Lemon Squeezy üzerinde iptal edildi. Otomatik yenileme durduruldu ve erişim kapatıldı."}
          </p>
        </Card>
      ) : null}

      {params.billingRequest === "cancel_failed" ||
      params.billingRequest === "provider_unsupported" ? (
        <Card
          className="mb-5 border-red-300/25 bg-red-300/[0.06] p-5"
          variant="default"
        >
          <Badge variant="coming-soon">İptal tamamlanamadı</Badge>
          <p className="text-body-s mt-3 text-[var(--text-secondary)]">
            Abonelik sağlayıcısına ulaşılamadığı için yenileme durdurulmadı.
            Hesabınızda herhangi bir iptal değişikliği yapılmadı. Lütfen kısa
            süre sonra yeniden deneyin veya destek ile iletişime geçin.
          </p>
        </Card>
      ) : null}

      <Card className="mb-5 p-5" variant="default">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div>
            <Badge variant="beta">Aninda iptal</Badge>
            <h2 className="text-h3 mt-4">Aboneligi iptal edin</h2>
            <p className="text-body-s mt-3 text-[var(--text-secondary)]">
              Deneme surecindeyseniz iptal aninda uygulanir ve para cekilmez.
              Odeme alinmis aktif abonelikte yenileme durdurulur; odenmis donem
              sonuna kadar erisiminiz korunur.
            </p>
          </div>

          {cancellableSubscriptions.length > 0 ? (
            <form action={cancelSubscriptionNow} className="grid gap-3">
              <label className="grid gap-2 text-body-s text-[var(--text-secondary)]">
                Iptal edilecek abonelik
                <select
                  name="subscriptionId"
                  required
                  className="h-11 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-[var(--text-primary)] outline-none"
                >
                  {cancellableSubscriptions.map((subscription) => (
                    <option key={subscription.id} value={subscription.id}>
                      {subscription.product.name} - {subscription.status} -{" "}
                      {formatDate(
                        subscription.renewsAt ?? subscription.trialEndsAt,
                      )}
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
                Aciklama
                <textarea
                  name="message"
                  rows={3}
                  placeholder="Isterseniz kisa bir not yazin. Ornek: Deneme surecinde ihtiyacim kalmadi."
                  className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-3 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                />
              </label>

              <Button type="submit">Aboneligi iptal et</Button>
            </form>
          ) : (
            <div className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 text-body-s text-[var(--text-secondary)]">
              Iptal edilebilir aktif abonelik bulunmuyor.
            </div>
          )}
        </div>
      </Card>

      <Card className="mb-5 p-5" variant="default">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div>
            <Badge variant="beta">Iade incelemesi</Badge>
            <h2 className="text-h3 mt-4">Iade talebi olusturun</h2>
            <p className="text-body-s mt-3 text-[var(--text-secondary)]">
              Odeme alindiysa iade talebi gonderebilirsiniz. Talep admin
              paneline duser; iade uygunlugu ve Lemon Squeezy islemi kontrol
              edilerek sonuclandirilir.
            </p>
          </div>

          <form action={createBillingRequest} className="grid gap-3">
            <input name="type" type="hidden" value={BillingRequestType.REFUND} />

            <label className="grid gap-2 text-body-s text-[var(--text-secondary)]">
              Urun
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
              Ilgili odeme
              <select
                name="paymentId"
                className="h-11 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-[var(--text-primary)] outline-none"
              >
                <option value="">Odeme secmeden devam et</option>
                {paidPayments.map((payment) => (
                  <option key={payment.id} value={payment.id}>
                    {payment.product.name} -{" "}
                    {formatPaymentAmount(payment.amount, payment.currency)} -{" "}
                    {formatDate(payment.paidAt ?? payment.createdAt)}
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
              Aciklama
              <textarea
                name="message"
                rows={4}
                placeholder="Iade talebinizi kisaca anlatin. Ornek: Yanlislikla satin aldim veya odeme iki kez alinmis gorunuyor."
                className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-3 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </label>

            <Button type="submit">Iade talebi gonder</Button>
          </form>
        </div>
      </Card>

      <Card className="mb-5 overflow-hidden" variant="default">
        <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3">
          <h2 className="text-body-s font-medium">Talep ve iptal gecmisi</h2>
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
                  ? formatPaymentAmount(
                      request.payment.amount,
                      request.payment.currency,
                    )
                  : reasonLabels[request.reason]}
              </span>
            </div>
          ))
        ) : (
          <div className="px-4 py-5 text-body-s text-[var(--text-tertiary)]">
            Henuz iptal veya iade kaydiniz yok.
          </div>
        )}
      </Card>

      <BillingTable invoices={invoices} payments={payments} />
    </>
  );
}

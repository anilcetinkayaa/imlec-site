"use server";

import {
  BillingRequestStatus,
  BillingRequestType,
  EntitlementSource,
  EntitlementStatus,
  PaymentStatus,
  SubscriptionStatus,
} from "@prisma/client";
import { createElement } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RefundCompletedEmail } from "@/emails/RefundCompletedEmail";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/src/db/prisma";
import { requireAdminSession, toJsonValue } from "@/src/server/admin-action-log";
import {
  cancelLemonSqueezySubscription,
  refundLemonSqueezyOrder,
  refundLemonSqueezySubscriptionInvoice,
} from "@/src/server/lemonsqueezy-api";

type ProviderResource = {
  type: "order" | "subscription-invoice";
  id: string;
};

function providerIds(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as {
    data?: { id?: unknown; attributes?: Record<string, unknown> };
  };
  const attributes = record.data?.attributes ?? {};
  return [
    record.data?.id,
    attributes.order_id,
    attributes.order_number,
    attributes.invoice_id,
    attributes.subscription_invoice_id,
  ]
    .filter(
      (value): value is string | number =>
        typeof value === "string" || typeof value === "number",
    )
    .map(String);
}

async function resolveProviderResource({
  providerOrderId,
  hasSubscription,
}: {
  providerOrderId: string;
  hasSubscription: boolean;
}): Promise<ProviderResource> {
  const events = await prisma.lemonSqueezyWebhookEvent.findMany({
    where: {
      eventName: {
        in: [
          "order_created",
          "order_refunded",
          "subscription_payment_success",
          "subscription_payment_recovered",
          "subscription_payment_failed",
          "subscription_payment_refunded",
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      eventName: true,
      payload: true,
    },
  });
  const matching = events.find((event) =>
    providerIds(event.payload).includes(providerOrderId),
  );

  if (matching) {
    const dataId = providerIds(matching.payload)[0];
    if (dataId) {
      return {
        type: matching.eventName.startsWith("subscription_payment_")
          ? "subscription-invoice"
          : "order",
        id: dataId,
      };
    }
  }

  return {
    type: hasSubscription ? "subscription-invoice" : "order",
    id: providerOrderId,
  };
}

function formatAmount(amount: number, currency: string) {
  return (amount / 100).toLocaleString("tr-TR", {
    style: "currency",
    currency,
  });
}

export async function processRefundRequest(formData: FormData) {
  const admin = await requireAdminSession({ write: true });

  if ("error" in admin) {
    redirect("/admin/accounting?refund=forbidden");
  }

  const requestId = String(formData.get("requestId") ?? "").trim();
  const request = await prisma.billingRequest.findFirst({
    where: {
      id: requestId,
      type: BillingRequestType.REFUND,
      status: {
        in: [BillingRequestStatus.OPEN, BillingRequestStatus.REVIEWING],
      },
    },
    include: {
      user: { select: { id: true, email: true } },
      product: { select: { id: true, name: true } },
      payment: true,
      subscription: true,
    },
  });

  if (!request?.payment) {
    redirect("/admin/accounting?refund=payment_missing");
  }
  if (request.payment.provider !== "lemonsqueezy") {
    redirect("/admin/accounting?refund=provider_unsupported");
  }
  if (request.payment.amount <= 0) {
    redirect("/admin/accounting?refund=zero_amount");
  }

  const payment = request.payment;
  const subscription =
    request.subscription ??
    (await prisma.subscription.findFirst({
      where: {
        userId: request.userId,
        productId: request.productId,
        provider: "lemonsqueezy",
      },
      orderBy: { updatedAt: "desc" },
    }));
  const resource = await resolveProviderResource({
    providerOrderId: payment.providerOrderId,
    hasSubscription: Boolean(subscription),
  });

  try {
    if (subscription && subscription.status !== SubscriptionStatus.EXPIRED) {
      await cancelLemonSqueezySubscription(
        subscription.providerSubscriptionId,
      );
    }
    if (resource.type === "subscription-invoice") {
      await refundLemonSqueezySubscriptionInvoice({
        subscriptionInvoiceId: resource.id,
        amount: payment.amount,
      });
    } else {
      await refundLemonSqueezyOrder({
        orderId: resource.id,
        amount: payment.amount,
      });
    }
  } catch (error) {
    console.error(
      "[LEMONSQUEEZY REFUND ERROR]",
      error instanceof Error ? error.message : "UNKNOWN_ERROR",
    );
    redirect("/admin/accounting?refund=provider_failed");
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.REFUNDED },
    });
    await tx.billingRequest.update({
      where: { id: request.id },
      data: {
        status: BillingRequestStatus.COMPLETED,
        reviewedById: admin.session.user.id,
        reviewedAt: now,
        adminNote:
          "Lemon Squeezy tam iadesi tamamlandı. Muhasebe iade belgesi ayrıca kontrol edilmelidir.",
      },
    });
    if (subscription) {
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.CANCELED,
          endsAt: now,
        },
      });
    }
    await tx.entitlement.updateMany({
      where: {
        userId: request.userId,
        productId: request.productId,
        source: EntitlementSource.LEMON_SQUEEZY,
      },
      data: {
        status: EntitlementStatus.REVOKED,
        expiresAt: now,
        revokedAt: now,
      },
    });
    await tx.adminActionLog.create({
      data: {
        adminId: admin.session.user.id,
        targetUserId: request.userId,
        action: "BILLING_REFUND_COMPLETE",
        before: toJsonValue({
          billingRequestStatus: request.status,
          paymentStatus: payment.status,
          subscriptionStatus: subscription?.status ?? null,
        }),
        after: toJsonValue({
          billingRequestStatus: BillingRequestStatus.COMPLETED,
          paymentStatus: PaymentStatus.REFUNDED,
          subscriptionStatus: subscription
            ? SubscriptionStatus.CANCELED
            : null,
          providerResource: resource,
        }),
      },
    });
  });

  await sendMail({
    to: request.user.email,
    subject: `${request.product.name} ödeme iadeniz tamamlandı`,
    react: createElement(RefundCompletedEmail, {
      productName: request.product.name,
      amount: formatAmount(payment.amount, payment.currency),
    }),
  });

  revalidatePath("/admin/accounting");
  revalidatePath("/account/billing");
  redirect("/admin/accounting?refund=completed");
}

export async function rejectRefundRequest(formData: FormData) {
  const admin = await requireAdminSession({ write: true });

  if ("error" in admin) {
    redirect("/admin/accounting?refund=forbidden");
  }

  const requestId = String(formData.get("requestId") ?? "").trim();
  const request = await prisma.billingRequest.findFirst({
    where: {
      id: requestId,
      type: BillingRequestType.REFUND,
      status: {
        in: [BillingRequestStatus.OPEN, BillingRequestStatus.REVIEWING],
      },
    },
  });

  if (!request) {
    redirect("/admin/accounting?refund=request_missing");
  }

  await prisma.$transaction(async (tx) => {
    await tx.billingRequest.update({
      where: { id: request.id },
      data: {
        status: BillingRequestStatus.REJECTED,
        reviewedById: admin.session.user.id,
        reviewedAt: new Date(),
        adminNote: "İade talebi yönetici tarafından reddedildi.",
      },
    });
    await tx.adminActionLog.create({
      data: {
        adminId: admin.session.user.id,
        targetUserId: request.userId,
        action: "BILLING_REFUND_REJECT",
        before: toJsonValue({ status: request.status }),
        after: toJsonValue({ status: BillingRequestStatus.REJECTED }),
      },
    });
  });

  revalidatePath("/admin/accounting");
  revalidatePath("/account/billing");
  redirect("/admin/accounting?refund=rejected");
}

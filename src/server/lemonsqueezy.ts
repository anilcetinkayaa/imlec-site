import {
  EntitlementSource,
  EntitlementStatus,
  PaymentStatus,
  SubscriptionStatus,
} from "@prisma/client";
import { createElement } from "react";
import { PaymentFailedEmail } from "@/emails/PaymentFailedEmail";
import { PaymentSuccessEmail } from "@/emails/PaymentSuccessEmail";
import { TrialStartedEmail } from "@/emails/TrialStartedEmail";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/src/db/prisma";
import { upsertEntitlementBySource } from "@/src/server/entitlement-helpers";

type LemonSqueezyPayload = {
  meta?: {
    event_name?: string;
    test_mode?: boolean;
    custom_data?: {
      user_id?: string;
      product_slug?: string;
      source?: string;
    };
  };
  data?: {
    id?: string;
    type?: string;
    attributes?: Record<string, unknown>;
    relationships?: Record<string, unknown>;
  };
};

const handledEvents = new Set([
  "order_created",
  "order_refunded",
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_expired",
  "subscription_payment_success",
  "subscription_payment_failed",
  "license_key_created",
  "license_key_updated",
]);

function asString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function asProviderString(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
}

function asNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mapSubscriptionStatus(value: string | null): SubscriptionStatus {
  switch (value) {
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "on_trial":
      return SubscriptionStatus.TRIALING;
    case "past_due":
    case "unpaid":
      return SubscriptionStatus.PAST_DUE;
    case "cancelled":
      return SubscriptionStatus.CANCELED;
    case "expired":
      return SubscriptionStatus.EXPIRED;
    default:
      return SubscriptionStatus.PAUSED;
  }
}

async function findWebhookUser(payload: LemonSqueezyPayload) {
  const userId = payload.meta?.custom_data?.user_id;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (user) {
      return user;
    }
  }

  const email =
    asString(payload.data?.attributes?.user_email) ??
    asString(payload.data?.attributes?.customer_email) ??
    asString(payload.data?.attributes?.email);

  if (!email) {
    return null;
  }

  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true },
  });
}

async function getProduct(payload: LemonSqueezyPayload) {
  const slug = payload.meta?.custom_data?.product_slug ?? "fis260";

  return prisma.product.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
}

function paymentGraceEndsAt() {
  const days = Number.parseInt(process.env.LEMONSQUEEZY_PAYMENT_GRACE_DAYS ?? "7", 10);
  const safeDays = Number.isFinite(days) && days > 0 ? days : 7;
  return new Date(Date.now() + safeDays * 24 * 60 * 60 * 1000);
}

async function ensureEntitlement({
  userId,
  productId,
  subscriptionId,
  status = EntitlementStatus.ACTIVE,
  expiresAt,
}: {
  userId: string;
  productId: string;
  subscriptionId?: string | null;
  status?: EntitlementStatus;
  expiresAt?: Date | null;
}) {
  return prisma.$transaction((tx) =>
    upsertEntitlementBySource(tx, {
      userId,
      productId,
      subscriptionId,
      status,
      source: EntitlementSource.LEMON_SQUEEZY,
      expiresAt: expiresAt ?? null,
      revokedAt: null,
    }),
  );
}

async function revokeEntitlement({
  userId,
  productId,
}: {
  userId: string;
  productId: string;
}) {
  return prisma.entitlement.updateMany({
    where: {
      userId,
      productId,
      source: EntitlementSource.LEMON_SQUEEZY,
    },
    data: {
      status: EntitlementStatus.REVOKED,
      revokedAt: new Date(),
    },
  });
}

function paymentStatusForEvent(eventName: string) {
  if (eventName === "order_refunded") {
    return PaymentStatus.REFUNDED;
  }
  if (eventName === "subscription_payment_failed") {
    return PaymentStatus.FAILED;
  }
  if (eventName === "order_created" || eventName === "subscription_payment_success") {
    return PaymentStatus.PAID;
  }
  return PaymentStatus.PENDING;
}

function paymentIdForPayload(eventName: string, payload: LemonSqueezyPayload) {
  const attributes = payload.data?.attributes ?? {};
  return (
    asProviderString(attributes.order_id) ??
    asProviderString(attributes.order_number) ??
    asProviderString(attributes.invoice_id) ??
    asProviderString(attributes.subscription_invoice_id) ??
    (payload.data?.id ? `${eventName}:${payload.data.id}` : null)
  );
}

async function upsertPayment({
  eventName,
  payload,
  userId,
  productId,
  subscriptionId,
}: {
  eventName: string;
  payload: LemonSqueezyPayload;
  userId: string;
  productId: string;
  subscriptionId?: string | null;
}) {
  const status = paymentStatusForEvent(eventName);

  if (status === PaymentStatus.PENDING) {
    return null;
  }

  const attributes = payload.data?.attributes ?? {};
  const providerOrderId = paymentIdForPayload(eventName, payload);

  if (!providerOrderId) {
    return null;
  }

  const amount =
    asNumber(attributes.total) ??
    asNumber(attributes.amount) ??
    asNumber(attributes.subtotal) ??
    0;
  const currency =
    asString(attributes.currency) ??
    asString(attributes.currency_code) ??
    "TRY";
  const testMode = payload.meta?.test_mode === true;
  const paidAt =
    status === PaymentStatus.PAID
      ? parseDate(attributes.created_at) ?? new Date()
      : null;

  return prisma.payment.upsert({
    where: {
      provider_providerOrderId: {
        provider: "lemonsqueezy",
        providerOrderId,
      },
    },
    update: {
      userId,
      productId,
      subscriptionId,
      amount,
      currency,
      status,
      testMode,
      paidAt,
    },
    create: {
      userId,
      productId,
      subscriptionId,
      provider: "lemonsqueezy",
      providerOrderId,
      amount,
      currency,
      status,
      testMode,
      paidAt,
    },
  });
}

async function upsertSubscription({
  eventName,
  payload,
  userId,
  productId,
}: {
  eventName: string;
  payload: LemonSqueezyPayload;
  userId: string;
  productId: string;
}) {
  const attributes = payload.data?.attributes ?? {};
  const providerSubscriptionId =
    asProviderString(attributes.subscription_id) ??
    (eventName.startsWith("subscription_") ? payload.data?.id : null);

  if (!providerSubscriptionId) {
    return null;
  }

  return prisma.subscription.upsert({
    where: {
      provider_providerSubscriptionId: {
        provider: "lemonsqueezy",
        providerSubscriptionId,
      },
    },
    update: {
      providerCustomerId: asProviderString(attributes.customer_id),
      providerVariantId: asProviderString(attributes.variant_id),
      status: mapSubscriptionStatus(asString(attributes.status)),
      renewsAt: parseDate(attributes.renews_at),
      endsAt: parseDate(attributes.ends_at),
      trialEndsAt: parseDate(attributes.trial_ends_at),
    },
    create: {
      userId,
      productId,
      provider: "lemonsqueezy",
      providerCustomerId: asProviderString(attributes.customer_id),
      providerSubscriptionId,
      providerVariantId: asProviderString(attributes.variant_id),
      status: mapSubscriptionStatus(asString(attributes.status)),
      renewsAt: parseDate(attributes.renews_at),
      endsAt: parseDate(attributes.ends_at),
      trialEndsAt: parseDate(attributes.trial_ends_at),
    },
  });
}

async function upsertCustomer({
  payload,
  userId,
}: {
  payload: LemonSqueezyPayload;
  userId: string;
}) {
  const attributes = payload.data?.attributes ?? {};
  const lemonSqueezyId = asProviderString(attributes.customer_id);

  if (!lemonSqueezyId) {
    return null;
  }

  return prisma.lemonSqueezyCustomer.upsert({
    where: { lemonSqueezyId },
    update: {
      userId,
      email: asString(attributes.user_email) ?? asString(attributes.customer_email),
    },
    create: {
      userId,
      lemonSqueezyId,
      email: asString(attributes.user_email) ?? asString(attributes.customer_email),
    },
  });
}

async function upsertLicense({
  payload,
  userId,
  subscriptionId,
}: {
  payload: LemonSqueezyPayload;
  userId: string;
  subscriptionId?: string | null;
}) {
  const attributes = payload.data?.attributes ?? {};
  const licenseKeyId = payload.data?.id;

  if (!licenseKeyId) {
    return null;
  }

  return prisma.lemonSqueezyLicense.upsert({
    where: { licenseKeyId },
    update: {
      userId,
      subscriptionId,
      licenseKey: asString(attributes.key),
      activationLimit: asNumber(attributes.activation_limit),
      status: asString(attributes.status),
    },
    create: {
      userId,
      subscriptionId,
      licenseKeyId,
      licenseKey: asString(attributes.key),
      activationLimit: asNumber(attributes.activation_limit),
      status: asString(attributes.status),
    },
  });
}

async function sendPaymentEmail({
  eventName,
  userEmail,
  productName,
  amount,
}: {
  eventName: string;
  userEmail: string;
  productName: string;
  amount?: string;
}) {
  if (eventName === "subscription_payment_success" || eventName === "order_created") {
    await sendMail({
      to: userEmail,
      subject: "Ödeme kaydınız işlendi",
      react: createElement(PaymentSuccessEmail, {
        productName,
        amount: amount ?? "kayıtlı tutar",
      }),
    });
  }

  if (eventName === "subscription_payment_failed") {
    await sendMail({
      to: userEmail,
      subject: "Ödeme işlemi tamamlanamadı",
      react: createElement(PaymentFailedEmail, {
        productName,
      }),
    });
  }
}

export async function processLemonSqueezyEvent(payload: LemonSqueezyPayload) {
  const eventName = payload.meta?.event_name;

  if (!eventName || !handledEvents.has(eventName)) {
    return { processed: false, reason: "IGNORED_EVENT" };
  }

  const [user, product] = await Promise.all([
    findWebhookUser(payload),
    getProduct(payload),
  ]);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  await upsertCustomer({ payload, userId: user.id });

  const subscription = await upsertSubscription({
    eventName,
    payload,
    userId: user.id,
    productId: product.id,
  });

  await upsertPayment({
    eventName,
    payload,
    userId: user.id,
    productId: product.id,
    subscriptionId: subscription?.id,
  });

  if (
    eventName === "order_created" ||
    eventName === "subscription_created" ||
    eventName === "subscription_payment_success"
  ) {
    await ensureEntitlement({
      userId: user.id,
      productId: product.id,
      subscriptionId: subscription?.id,
      expiresAt: subscription?.endsAt ?? subscription?.trialEndsAt,
    });
  }

  if (eventName === "subscription_updated" && subscription) {
    if (
      subscription.status === SubscriptionStatus.ACTIVE ||
      subscription.status === SubscriptionStatus.TRIALING
    ) {
      await ensureEntitlement({
        userId: user.id,
        productId: product.id,
        subscriptionId: subscription.id,
        expiresAt: subscription.endsAt ?? subscription.trialEndsAt,
      });
    } else if (subscription.status === SubscriptionStatus.PAST_DUE) {
      await ensureEntitlement({
        userId: user.id,
        productId: product.id,
        subscriptionId: subscription.id,
        status: EntitlementStatus.GRACE_PERIOD,
        expiresAt: paymentGraceEndsAt(),
      });
    }
  }

  if (eventName === "subscription_payment_failed") {
    await ensureEntitlement({
      userId: user.id,
      productId: product.id,
      subscriptionId: subscription?.id,
      status: EntitlementStatus.GRACE_PERIOD,
      expiresAt: paymentGraceEndsAt(),
    });
  }

  if (eventName === "subscription_cancelled") {
    if (subscription?.endsAt && subscription.endsAt > new Date()) {
      await ensureEntitlement({
        userId: user.id,
        productId: product.id,
        subscriptionId: subscription.id,
        expiresAt: subscription.endsAt,
      });
    } else {
      await revokeEntitlement({
        userId: user.id,
        productId: product.id,
      });
    }
  }

  if (eventName === "subscription_expired" || eventName === "order_refunded") {
    await revokeEntitlement({
      userId: user.id,
      productId: product.id,
    });
  }

  if (eventName === "license_key_created" || eventName === "license_key_updated") {
    await upsertLicense({
      payload,
      userId: user.id,
      subscriptionId: subscription?.id,
    });
  }

  if (
    eventName === "subscription_payment_success" ||
    eventName === "subscription_payment_failed" ||
    eventName === "order_created"
  ) {
    const attributes = payload.data?.attributes ?? {};
    const total =
      asString(attributes.total_formatted) ??
      asString(attributes.subtotal_formatted);

    await sendPaymentEmail({
      eventName,
      userEmail: user.email,
      productName: product.name,
      amount: total ?? undefined,
    });
  }

  if (eventName === "subscription_created") {
    await sendMail({
      to: user.email,
      subject: `${product.name} erişiminiz başladı`,
      react: createElement(TrialStartedEmail, {
        productName: product.name,
      }),
    });
  }

  return { processed: true };
}

export type { LemonSqueezyPayload };

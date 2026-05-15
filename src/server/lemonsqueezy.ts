import {
  EntitlementSource,
  EntitlementStatus,
  SubscriptionStatus,
} from "@prisma/client";
import { createElement } from "react";
import { PaymentFailedEmail } from "@/emails/PaymentFailedEmail";
import { PaymentSuccessEmail } from "@/emails/PaymentSuccessEmail";
import { TrialStartedEmail } from "@/emails/TrialStartedEmail";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/src/db/prisma";

type LemonSqueezyPayload = {
  meta?: {
    event_name?: string;
    custom_data?: {
      user_id?: string;
      product_slug?: string;
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
  return typeof value === "number" ? value : null;
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

async function ensureEntitlement({
  userId,
  productId,
  subscriptionId,
  expiresAt,
}: {
  userId: string;
  productId: string;
  subscriptionId?: string | null;
  expiresAt?: Date | null;
}) {
  return prisma.entitlement.upsert({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
    update: {
      status: EntitlementStatus.ACTIVE,
      source: EntitlementSource.LEMON_SQUEEZY,
      subscriptionId: subscriptionId ?? undefined,
      expiresAt: expiresAt ?? null,
      revokedAt: null,
    },
    create: {
      userId,
      productId,
      subscriptionId,
      status: EntitlementStatus.ACTIVE,
      source: EntitlementSource.LEMON_SQUEEZY,
      expiresAt: expiresAt ?? null,
    },
  });
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

  if (
    eventName === "order_created" ||
    eventName === "subscription_created" ||
    eventName === "subscription_updated" ||
    eventName === "subscription_payment_success"
  ) {
    await ensureEntitlement({
      userId: user.id,
      productId: product.id,
      subscriptionId: subscription?.id,
      expiresAt: subscription?.endsAt,
    });
  }

  if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
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

"use server";

import {
  BillingRequestReason,
  BillingRequestStatus,
  BillingRequestType,
  EntitlementSource,
  EntitlementStatus,
  SubscriptionStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/src/db/prisma";
import { cancelLemonSqueezySubscription } from "@/src/server/lemonsqueezy-api";

const requestTypes = new Set(Object.values(BillingRequestType));
const requestReasons = new Set(Object.values(BillingRequestReason));

function cleanOptional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, 1500) : null;
}

export async function createBillingRequest(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/billing");
  }

  const rawType = String(formData.get("type") ?? "");
  const rawReason = String(formData.get("reason") ?? "");
  const productId = String(formData.get("productId") ?? "").trim();
  const subscriptionId = cleanOptional(formData.get("subscriptionId"));
  const paymentId = cleanOptional(formData.get("paymentId"));
  const message = cleanOptional(formData.get("message"));

  if (
    !requestTypes.has(rawType as BillingRequestType) ||
    rawType !== BillingRequestType.REFUND
  ) {
    redirect("/account/billing?billingRequest=invalid");
  }

  if (!requestReasons.has(rawReason as BillingRequestReason)) {
    redirect("/account/billing?billingRequest=invalid");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    redirect("/account/billing?billingRequest=invalid");
  }

  const [subscription, payment] = await Promise.all([
    subscriptionId
      ? prisma.subscription.findFirst({
          where: {
            id: subscriptionId,
            userId: session.user.id,
            productId: product.id,
          },
          select: { id: true },
        })
      : null,
    paymentId
      ? prisma.payment.findFirst({
          where: {
            id: paymentId,
            userId: session.user.id,
            productId: product.id,
          },
          select: { id: true },
        })
      : null,
  ]);

  if (subscriptionId && !subscription) {
    redirect("/account/billing?billingRequest=invalid");
  }

  if (paymentId && !payment) {
    redirect("/account/billing?billingRequest=invalid");
  }

  await prisma.billingRequest.create({
    data: {
      userId: session.user.id,
      productId: product.id,
      subscriptionId: subscription?.id,
      paymentId: payment?.id,
      type: rawType as BillingRequestType,
      reason: rawReason as BillingRequestReason,
      message,
    },
  });

  revalidatePath("/account/billing");
  revalidatePath("/admin/accounting");
  redirect("/account/billing?billingRequest=sent");
}

export async function cancelSubscriptionNow(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/billing");
  }

  const subscriptionId = String(formData.get("subscriptionId") ?? "").trim();
  const rawReason = String(formData.get("reason") ?? "");
  const message = cleanOptional(formData.get("message"));

  if (!subscriptionId || !requestReasons.has(rawReason as BillingRequestReason)) {
    redirect("/account/billing?billingRequest=invalid");
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
      userId: session.user.id,
    },
    select: {
      id: true,
      productId: true,
      provider: true,
      providerSubscriptionId: true,
      status: true,
      renewsAt: true,
      endsAt: true,
      trialEndsAt: true,
    },
  });

  if (!subscription) {
    redirect("/account/billing?billingRequest=invalid");
  }

  if (subscription.provider !== "lemonsqueezy") {
    redirect("/account/billing?billingRequest=provider_unsupported");
  }

  let providerEndsAt: Date | null = null;
  let providerCancelFailed = false;

  try {
    const cancellation = await cancelLemonSqueezySubscription(
      subscription.providerSubscriptionId,
    );
    providerEndsAt = cancellation.endsAt;
  } catch (error) {
    console.error(
      "[LEMONSQUEEZY CANCEL ERROR]",
      error instanceof Error ? error.message : "UNKNOWN_ERROR",
    );
    providerCancelFailed = true;
  }

  if (providerCancelFailed) {
    redirect("/account/billing?billingRequest=cancel_failed");
  }

  const now = new Date();
  const isTrial =
    subscription.status === SubscriptionStatus.TRIALING &&
    (!subscription.trialEndsAt || subscription.trialEndsAt > now);
  const accessEndsAt =
    providerEndsAt ??
    subscription.endsAt ??
    subscription.renewsAt ??
    subscription.trialEndsAt ??
    now;
  const keepAccessUntilPeriodEnd = accessEndsAt > now;

  await prisma.$transaction(async (tx) => {
    await tx.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        status: SubscriptionStatus.CANCELED,
        endsAt: accessEndsAt,
      },
    });

    await tx.entitlement.updateMany({
      where: {
        userId: session.user.id,
        productId: subscription.productId,
        source: EntitlementSource.LEMON_SQUEEZY,
        OR: [
          { subscriptionId: subscription.id },
          { subscriptionId: null },
        ],
      },
      data: keepAccessUntilPeriodEnd
        ? {
            status: EntitlementStatus.ACTIVE,
            expiresAt: accessEndsAt,
            revokedAt: null,
          }
        : {
            status: EntitlementStatus.REVOKED,
            expiresAt: now,
            revokedAt: now,
          },
    });

    await tx.billingRequest.create({
      data: {
        userId: session.user.id,
        productId: subscription.productId,
        subscriptionId: subscription.id,
        type: isTrial
          ? BillingRequestType.CANCEL_TRIAL
          : BillingRequestType.CANCEL_SUBSCRIPTION,
        status: BillingRequestStatus.COMPLETED,
        reason: rawReason as BillingRequestReason,
        message:
          message ??
          "Kullanıcı panelinden onay beklemeden abonelik iptali yapıldı.",
        reviewedAt: now,
      },
    });
  });

  revalidatePath("/account/billing");
  revalidatePath("/admin/accounting");
  revalidatePath("/admin");
  redirect(
    `/account/billing?billingRequest=${keepAccessUntilPeriodEnd ? "canceled_period" : "canceled"}`,
  );
}

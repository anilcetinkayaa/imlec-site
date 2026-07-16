import {
  EntitlementSource,
  EntitlementStatus,
  SubscriptionStatus,
  type Prisma,
} from "@prisma/client";
import type { LemonSqueezySubscriptionSnapshot } from "@/src/server/lemonsqueezy-api";
import { upsertEntitlementBySource } from "@/src/server/entitlement-helpers";

type TransactionClient = Prisma.TransactionClient;

export function mapLemonSqueezySubscriptionStatus(
  status: string,
): SubscriptionStatus {
  switch (status) {
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
    case "paused":
      return SubscriptionStatus.PAUSED;
    default:
      return SubscriptionStatus.PAUSED;
  }
}

function paymentGraceEndsAt(renewsAt: Date | null) {
  const days = Number.parseInt(
    process.env.LEMONSQUEEZY_PAYMENT_GRACE_DAYS ?? "21",
    10,
  );
  const safeDays = Number.isFinite(days) && days > 0 ? days : 21;
  const from = renewsAt && renewsAt < new Date() ? renewsAt : new Date();
  return new Date(from.getTime() + safeDays * 24 * 60 * 60 * 1000);
}

export async function syncLemonSqueezySubscription({
  tx,
  userId,
  productId,
  snapshot,
}: {
  tx: TransactionClient;
  userId: string;
  productId: string;
  snapshot: LemonSqueezySubscriptionSnapshot;
}) {
  const now = new Date();
  const status = mapLemonSqueezySubscriptionStatus(snapshot.status);
  const subscription = await tx.subscription.upsert({
    where: {
      provider_providerSubscriptionId: {
        provider: "lemonsqueezy",
        providerSubscriptionId: snapshot.providerSubscriptionId,
      },
    },
    update: {
      userId,
      productId,
      providerCustomerId: snapshot.providerCustomerId,
      providerVariantId: snapshot.providerVariantId,
      status,
      renewsAt: snapshot.renewsAt,
      endsAt: snapshot.endsAt,
      trialEndsAt: snapshot.trialEndsAt,
    },
    create: {
      userId,
      productId,
      provider: "lemonsqueezy",
      providerCustomerId: snapshot.providerCustomerId,
      providerSubscriptionId: snapshot.providerSubscriptionId,
      providerVariantId: snapshot.providerVariantId,
      status,
      renewsAt: snapshot.renewsAt,
      endsAt: snapshot.endsAt,
      trialEndsAt: snapshot.trialEndsAt,
    },
  });

  let entitlementStatus: EntitlementStatus = EntitlementStatus.ACTIVE;
  let expiresAt: Date | null = null;
  let revokedAt: Date | null = null;

  if (status === SubscriptionStatus.TRIALING) {
    expiresAt = snapshot.trialEndsAt;
  } else if (
    status === SubscriptionStatus.PAST_DUE ||
    status === SubscriptionStatus.PAUSED
  ) {
    entitlementStatus = EntitlementStatus.GRACE_PERIOD;
    expiresAt = paymentGraceEndsAt(snapshot.renewsAt);
  } else if (status === SubscriptionStatus.CANCELED) {
    if (snapshot.endsAt && snapshot.endsAt > now) {
      expiresAt = snapshot.endsAt;
    } else {
      entitlementStatus = EntitlementStatus.REVOKED;
      expiresAt = now;
      revokedAt = now;
    }
  } else if (status === SubscriptionStatus.EXPIRED) {
    entitlementStatus = EntitlementStatus.REVOKED;
    expiresAt = now;
    revokedAt = now;
  }

  const entitlement = await upsertEntitlementBySource(tx, {
    userId,
    productId,
    subscriptionId: subscription.id,
    status: entitlementStatus,
    source: EntitlementSource.LEMON_SQUEEZY,
    expiresAt,
    revokedAt,
  });

  await tx.entitlement.updateMany({
    where: {
      userId,
      productId,
      source: EntitlementSource.LEMON_SQUEEZY,
      subscriptionId: null,
      id: { not: entitlement.id },
    },
    data: {
      status: EntitlementStatus.REVOKED,
      expiresAt: now,
      revokedAt: now,
    },
  });

  return subscription;
}

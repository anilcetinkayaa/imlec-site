import { EntitlementSource } from "@prisma/client";
import { prisma } from "@/src/db/prisma";
import {
  getLemonSqueezySubscriptionById,
  getLemonSqueezySubscriptionForEmail,
} from "@/src/server/lemonsqueezy-api";
import { syncLemonSqueezySubscription } from "@/src/server/lemonsqueezy-subscription-sync";

export async function reconcileLemonSqueezySubscriptions() {
  const localSubscriptions = await prisma.subscription.findMany({
    where: { provider: "lemonsqueezy" },
    select: {
      providerSubscriptionId: true,
      userId: true,
      productId: true,
    },
  });

  let synchronized = 0;
  let failed = 0;

  for (const local of localSubscriptions) {
    try {
      const snapshot = await getLemonSqueezySubscriptionById(
        local.providerSubscriptionId,
      );

      if (!snapshot) {
        failed += 1;
        continue;
      }

      await prisma.$transaction((tx) =>
        syncLemonSqueezySubscription({
          tx,
          userId: local.userId,
          productId: local.productId,
          snapshot,
        }),
      );
      synchronized += 1;
    } catch {
      failed += 1;
    }
  }

  const orphanEntitlements = await prisma.entitlement.findMany({
    where: {
      source: EntitlementSource.LEMON_SQUEEZY,
      subscriptionId: null,
      revokedAt: null,
      status: {
        in: ["ACTIVE", "GRACE_PERIOD"],
      },
    },
    distinct: ["userId", "productId"],
    select: {
      userId: true,
      productId: true,
      user: { select: { email: true } },
    },
  });

  for (const orphan of orphanEntitlements) {
    try {
      const snapshot = await getLemonSqueezySubscriptionForEmail(
        orphan.user.email,
      );

      if (!snapshot) {
        failed += 1;
        continue;
      }

      await prisma.$transaction((tx) =>
        syncLemonSqueezySubscription({
          tx,
          userId: orphan.userId,
          productId: orphan.productId,
          snapshot,
        }),
      );
      synchronized += 1;
    } catch {
      failed += 1;
    }
  }

  return {
    checked: localSubscriptions.length + orphanEntitlements.length,
    synchronized,
    failed,
  };
}

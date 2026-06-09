import {
  type EntitlementSource,
  EntitlementStatus,
  type Prisma,
} from "@prisma/client";

export function isEntitlementUsable(entitlement: {
  status: EntitlementStatus;
  expiresAt: Date | null;
  revokedAt: Date | null;
}) {
  return (
    (entitlement.status === EntitlementStatus.ACTIVE ||
      entitlement.status === EntitlementStatus.GRACE_PERIOD) &&
    !entitlement.revokedAt &&
    (!entitlement.expiresAt || entitlement.expiresAt > new Date())
  );
}

export function selectBestEntitlement<
  T extends {
    status: EntitlementStatus;
    expiresAt: Date | null;
    revokedAt: Date | null;
  },
>(entitlements: T[]) {
  const usable = entitlements.filter(isEntitlementUsable);

  if (usable.length === 0) {
    return entitlements[0] ?? null;
  }

  return usable.sort((a, b) => {
    if (!a.expiresAt && b.expiresAt) {
      return -1;
    }
    if (a.expiresAt && !b.expiresAt) {
      return 1;
    }
    return (b.expiresAt?.getTime() ?? 0) - (a.expiresAt?.getTime() ?? 0);
  })[0];
}

export async function upsertEntitlementBySource(
  tx: Prisma.TransactionClient,
  {
    userId,
    productId,
    source,
    subscriptionId,
    status,
    startsAt,
    expiresAt,
    revokedAt,
  }: {
    userId: string;
    productId: string;
    source: EntitlementSource;
    subscriptionId?: string | null;
    status: EntitlementStatus;
    startsAt?: Date;
    expiresAt?: Date | null;
    revokedAt?: Date | null;
  },
) {
  const existing = await tx.entitlement.findFirst({
    where: {
      userId,
      productId,
      source,
      ...(subscriptionId ? { subscriptionId } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existing) {
    return tx.entitlement.update({
      where: { id: existing.id },
      data: {
        status,
        subscriptionId: subscriptionId ?? existing.subscriptionId,
        startsAt: startsAt ?? existing.startsAt,
        expiresAt: expiresAt ?? null,
        revokedAt: revokedAt ?? null,
      },
    });
  }

  return tx.entitlement.create({
    data: {
      userId,
      productId,
      source,
      subscriptionId,
      status,
      startsAt: startsAt ?? new Date(),
      expiresAt: expiresAt ?? null,
      revokedAt: revokedAt ?? null,
    },
  });
}

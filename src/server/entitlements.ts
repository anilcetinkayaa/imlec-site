import { EntitlementStatus, ProductStatus } from "@prisma/client";
import { prisma } from "@/src/db/prisma";

export async function getUserProductAccess(userId: string) {
  const products = await prisma.product.findMany({
    where: {
      status: ProductStatus.ACTIVE,
    },
    orderBy: {
      name: "asc",
    },
    include: {
      entitlements: {
        where: {
          userId,
        },
        select: {
          status: true,
          source: true,
          expiresAt: true,
          revokedAt: true,
        },
        take: 1,
      },
    },
  });

  return products.map((product) => {
    const entitlement = product.entitlements[0];
    const hasAccess =
      (entitlement?.status === EntitlementStatus.ACTIVE ||
        entitlement?.status === EntitlementStatus.GRACE_PERIOD) &&
      !entitlement.revokedAt &&
      (!entitlement.expiresAt || entitlement.expiresAt > new Date());

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      hasAccess,
      entitlementStatus: entitlement?.status ?? EntitlementStatus.INACTIVE,
      entitlementSource: entitlement?.source ?? null,
      expiresAt: entitlement?.expiresAt ?? null,
    };
  });
}

export async function hasProductAccess(userId: string, productSlug: string) {
  const productAccess = await getUserProductAccess(userId);

  return productAccess.some(
    (product) => product.slug === productSlug && product.hasAccess,
  );
}

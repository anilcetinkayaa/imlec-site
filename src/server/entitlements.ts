import { EntitlementStatus, ProductStatus } from "@prisma/client";
import { prisma } from "@/src/db/prisma";
import {
  isEntitlementUsable,
  selectBestEntitlement,
} from "@/src/server/entitlement-helpers";

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
        orderBy: [
          {
            expiresAt: "desc",
          },
          {
            updatedAt: "desc",
          },
        ],
        select: {
          status: true,
          source: true,
          expiresAt: true,
          revokedAt: true,
        },
      },
    },
  });

  return products.map((product) => {
    const entitlement = selectBestEntitlement(product.entitlements);
    const hasAccess = entitlement ? isEntitlementUsable(entitlement) : false;

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

import { EntitlementStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/src/db/prisma";
import { requireAdminApi } from "@/src/server/admin";

function isEntitlementValid(entitlement: {
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

export async function GET(request: Request) {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  const session = await auth();
  const requestUrl = new URL(request.url);
  const userId = requestUrl.searchParams.get("userId");
  const productSlug = requestUrl.searchParams.get("productSlug")?.toLowerCase();

  if (!userId || !productSlug) {
    return Response.json(
      { ok: false, error: "MISSING_QUERY_PARAMS" },
      { status: 400 },
    );
  }

  const [user, product, recentDownloadLogs] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        emailVerifiedAt: true,
      },
    }),
    prisma.product.findUnique({
      where: {
        slug: productSlug,
      },
      select: {
        id: true,
        slug: true,
      },
    }),
    prisma.downloadLog.findMany({
      where: {
        productSlug,
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        success: true,
        reason: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    }),
  ]);

  const entitlement =
    user && product
      ? await prisma.entitlement.findUnique({
          where: {
            userId_productId: {
              userId: user.id,
              productId: product.id,
            },
          },
          select: {
            status: true,
            expiresAt: true,
            revokedAt: true,
          },
        })
      : null;

  return Response.json({
    user: {
      exists: Boolean(user),
      emailVerified: Boolean(user?.emailVerifiedAt),
    },
    product: {
      exists: Boolean(product),
      slug: product?.slug ?? productSlug,
    },
    entitlement: {
      exists: Boolean(entitlement),
      status: entitlement?.status ?? null,
      endsAt: entitlement?.expiresAt ?? null,
      valid: entitlement ? isEntitlementValid(entitlement) : false,
    },
    sessionTest: {
      idPresent: Boolean(session?.user?.id),
      rolePresent: Boolean(session?.user?.role),
    },
    recentDownloadLogs,
  });
}

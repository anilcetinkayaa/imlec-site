import { EntitlementSource, EntitlementStatus } from "@prisma/client";
import { prisma } from "@/src/db/prisma";
import {
  getClientIp,
  requireAdminSession,
  toJsonValue,
} from "@/src/server/admin-action-log";
import { sendAdminActionAlert } from "@/src/server/admin-email";

export const runtime = "nodejs";

type GrantBody = {
  userId: string;
  productId: string;
  expiresAt?: string | null;
  reason?: string | null;
};

function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

function isGrantBody(value: unknown): value is GrantBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "userId" in value &&
    "productId" in value &&
    typeof value.userId === "string" &&
    typeof value.productId === "string" &&
    (!("expiresAt" in value) ||
      value.expiresAt === null ||
      typeof value.expiresAt === "string") &&
    (!("reason" in value) ||
      value.reason === null ||
      typeof value.reason === "string")
  );
}

function parseOptionalDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function POST(request: Request) {
  const admin = await requireAdminSession({ write: true });

  if (admin.error) {
    return admin.error;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_BODY", 400);
  }

  if (!isGrantBody(body)) {
    return jsonError("INVALID_BODY", 400);
  }

  const expiresAt = parseOptionalDate(body.expiresAt);

  if (expiresAt === undefined) {
    return jsonError("INVALID_EXPIRES_AT", 400);
  }

  const [user, product] = await Promise.all([
    prisma.user.findUnique({
      where: { id: body.userId },
      select: { id: true },
    }),
    prisma.product.findUnique({
      where: { id: body.productId },
      select: { id: true },
    }),
  ]);

  if (!user) {
    return jsonError("USER_NOT_FOUND", 404);
  }

  if (!product) {
    return jsonError("PRODUCT_NOT_FOUND", 404);
  }

  const entitlement = await prisma.$transaction(async (tx) => {
    const before = await tx.entitlement.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: product.id,
        },
      },
    });
    const after = await tx.entitlement.upsert({
      where: {
        userId_productId: {
          userId: user.id,
          productId: product.id,
        },
      },
      update: {
        status: EntitlementStatus.ACTIVE,
        source: EntitlementSource.MANUAL,
        startsAt: new Date(),
        expiresAt,
        revokedAt: null,
      },
      create: {
        userId: user.id,
        productId: product.id,
        status: EntitlementStatus.ACTIVE,
        source: EntitlementSource.MANUAL,
        startsAt: new Date(),
        expiresAt,
        revokedAt: null,
      },
    });

    await tx.adminActionLog.create({
      data: {
        adminId: admin.session.user.id,
        targetUserId: user.id,
        action: "ENTITLEMENT_GRANT",
        before: toJsonValue(before),
        after: toJsonValue({
          entitlement: after,
          reason: body.reason ?? null,
        }),
        ipAddress: getClientIp(request),
      },
    });

    return after;
  });

  await sendAdminActionAlert({
    action: "ENTITLEMENT_GRANT",
    target: user.id,
  });

  return Response.json({ ok: true, entitlementId: entitlement.id });
}

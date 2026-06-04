import { DeviceStatus } from "@prisma/client";
import { prisma } from "@/src/db/prisma";
import {
  getClientIp,
  requireAdminSession,
  toJsonValue,
} from "@/src/server/admin-action-log";
import { sendAdminActionAlert } from "@/src/server/admin-email";

export const runtime = "nodejs";

type RevokeAllDevicesBody = {
  userId: string;
  productId?: string | null;
  reason?: string | null;
};

function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

function isRevokeAllDevicesBody(
  value: unknown,
): value is RevokeAllDevicesBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "userId" in value &&
    typeof value.userId === "string" &&
    (!("productId" in value) ||
      value.productId === null ||
      typeof value.productId === "string") &&
    (!("reason" in value) ||
      value.reason === null ||
      typeof value.reason === "string")
  );
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

  if (!isRevokeAllDevicesBody(body)) {
    return jsonError("INVALID_BODY", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: body.userId },
    select: { id: true },
  });

  if (!user) {
    return jsonError("USER_NOT_FOUND", 404);
  }

  if (body.productId) {
    const product = await prisma.product.findUnique({
      where: { id: body.productId },
      select: { id: true },
    });

    if (!product) {
      return jsonError("PRODUCT_NOT_FOUND", 404);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const where = {
      userId: user.id,
      productId: body.productId || undefined,
      revokedAt: null,
    };
    const before = await tx.device.findMany({ where });
    const updateResult = await tx.device.updateMany({
      where,
      data: {
        status: DeviceStatus.REVOKED,
        revokedAt: new Date(),
      },
    });
    const after = await tx.device.findMany({
      where: {
        id: {
          in: before.map((device) => device.id),
        },
      },
    });

    await tx.adminActionLog.create({
      data: {
        adminId: admin.session.user.id,
        targetUserId: user.id,
        action: "DEVICE_REVOKE_ALL",
        before: toJsonValue(before),
        after: toJsonValue({
          devices: after,
          reason: body.reason ?? null,
        }),
        ipAddress: getClientIp(request),
      },
    });

    return updateResult;
  });

  await sendAdminActionAlert({
    action: "DEVICE_REVOKE_ALL",
    target: user.id,
  });

  return Response.json({ ok: true, count: result.count });
}

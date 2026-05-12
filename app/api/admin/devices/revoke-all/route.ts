import { DeviceStatus } from "@prisma/client";
import { prisma } from "@/src/db/prisma";
import { requireAdminApi } from "@/src/server/admin";

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
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
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

  // reason ileride AuditLog/AdminAction entegrasyonu için alınabilir.
  void body.reason;

  const result = await prisma.device.updateMany({
    where: {
      userId: user.id,
      productId: body.productId || undefined,
      revokedAt: null,
    },
    data: {
      status: DeviceStatus.REVOKED,
      revokedAt: new Date(),
    },
  });

  return Response.json({ ok: true, count: result.count });
}

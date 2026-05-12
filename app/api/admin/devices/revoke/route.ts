import { DeviceStatus } from "@prisma/client";
import { prisma } from "@/src/db/prisma";
import { requireAdminApi } from "@/src/server/admin";

export const runtime = "nodejs";

type RevokeDeviceBody = {
  deviceId: string;
  reason?: string | null;
};

function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

function isRevokeDeviceBody(value: unknown): value is RevokeDeviceBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "deviceId" in value &&
    typeof value.deviceId === "string" &&
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

  if (!isRevokeDeviceBody(body)) {
    return jsonError("INVALID_BODY", 400);
  }

  const device = await prisma.device.findUnique({
    where: { id: body.deviceId },
    select: { id: true },
  });

  if (!device) {
    return jsonError("DEVICE_NOT_FOUND", 404);
  }

  // reason ileride AuditLog/AdminAction entegrasyonu için alınabilir.
  void body.reason;

  await prisma.device.update({
    where: { id: device.id },
    data: {
      status: DeviceStatus.REVOKED,
      revokedAt: new Date(),
    },
  });

  return Response.json({ ok: true });
}

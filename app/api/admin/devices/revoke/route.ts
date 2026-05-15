import { DeviceStatus } from "@prisma/client";
import { prisma } from "@/src/db/prisma";
import {
  getClientIp,
  requireAdminSession,
  toJsonValue,
} from "@/src/server/admin-action-log";
import { sendAdminActionAlert } from "@/src/server/admin-email";

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
  const admin = await requireAdminSession();

  if (admin.error) {
    return admin.error;
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
  });

  if (!device) {
    return jsonError("DEVICE_NOT_FOUND", 404);
  }

  await prisma.$transaction(async (tx) => {
    const after = await tx.device.update({
      where: { id: device.id },
      data: {
        status: DeviceStatus.REVOKED,
        revokedAt: new Date(),
      },
    });

    await tx.adminActionLog.create({
      data: {
        adminId: admin.session.user.id,
        targetUserId: device.userId,
        action: "DEVICE_REVOKE",
        before: toJsonValue(device),
        after: toJsonValue({
          device: after,
          reason: body.reason ?? null,
        }),
        ipAddress: getClientIp(request),
      },
    });
  });

  await sendAdminActionAlert({
    action: "DEVICE_REVOKE",
    target: device.userId,
  });

  return Response.json({ ok: true });
}

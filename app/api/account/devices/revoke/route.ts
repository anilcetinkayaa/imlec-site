import { AuditEventType, DeviceStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/src/db/prisma";

export const runtime = "nodejs";

function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

async function parseBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    return {
      shouldRedirect: false,
      deviceId: typeof body.deviceId === "string" ? body.deviceId.trim() : "",
    };
  }

  const formData = await request.formData();
  return {
    shouldRedirect: true,
    deviceId: String(formData.get("deviceId") ?? "").trim(),
  };
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const input = await parseBody(request);

  if (!input.deviceId) {
    return jsonError("INVALID_BODY", 400);
  }

  const device = await prisma.device.findFirst({
    where: {
      id: input.deviceId,
      userId: session.user.id,
    },
  });

  if (!device) {
    return jsonError("DEVICE_NOT_FOUND", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.device.update({
      where: { id: device.id },
      data: {
        status: DeviceStatus.REVOKED,
        revokedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        targetUserId: session.user.id,
        eventType: AuditEventType.DEVICE_REVOKED,
        entityType: "Device",
        entityId: device.id,
        metadata: {
          source: "account_self_service",
          productId: device.productId,
        },
      },
    });
  });

  if (input.shouldRedirect) {
    return NextResponse.redirect(new URL("/account/devices", request.url), 303);
  }

  return Response.json({ ok: true });
}

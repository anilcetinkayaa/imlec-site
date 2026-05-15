import { EntitlementStatus } from "@prisma/client";
import { prisma } from "@/src/db/prisma";
import {
  getClientIp,
  requireAdminSession,
  toJsonValue,
} from "@/src/server/admin-action-log";
import { sendAdminActionAlert } from "@/src/server/admin-email";

export const runtime = "nodejs";

type RevokeEntitlementBody = {
  entitlementId: string;
  reason?: string | null;
};

function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

function isRevokeEntitlementBody(
  value: unknown,
): value is RevokeEntitlementBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "entitlementId" in value &&
    typeof value.entitlementId === "string" &&
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

  if (!isRevokeEntitlementBody(body)) {
    return jsonError("INVALID_BODY", 400);
  }

  const entitlement = await prisma.entitlement.findUnique({
    where: { id: body.entitlementId },
  });

  if (!entitlement) {
    return jsonError("ENTITLEMENT_NOT_FOUND", 404);
  }

  await prisma.$transaction(async (tx) => {
    const after = await tx.entitlement.update({
      where: { id: entitlement.id },
      data: {
        status: EntitlementStatus.REVOKED,
        revokedAt: new Date(),
      },
    });

    await tx.adminActionLog.create({
      data: {
        adminId: admin.session.user.id,
        targetUserId: entitlement.userId,
        action: "ENTITLEMENT_REVOKE",
        before: toJsonValue(entitlement),
        after: toJsonValue({
          entitlement: after,
          reason: body.reason ?? null,
        }),
        ipAddress: getClientIp(request),
      },
    });
  });

  await sendAdminActionAlert({
    action: "ENTITLEMENT_REVOKE",
    target: entitlement.userId,
  });

  return Response.json({ ok: true });
}

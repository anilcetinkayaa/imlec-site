import { EntitlementStatus } from "@prisma/client";
import { prisma } from "@/src/db/prisma";
import { requireAdminApi } from "@/src/server/admin";

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

  if (!isRevokeEntitlementBody(body)) {
    return jsonError("INVALID_BODY", 400);
  }

  const entitlement = await prisma.entitlement.findUnique({
    where: { id: body.entitlementId },
    select: { id: true },
  });

  if (!entitlement) {
    return jsonError("ENTITLEMENT_NOT_FOUND", 404);
  }

  // reason ileride AuditLog/AdminAction entegrasyonu için alınabilir.
  void body.reason;

  await prisma.entitlement.update({
    where: { id: entitlement.id },
    data: {
      status: EntitlementStatus.REVOKED,
      revokedAt: new Date(),
    },
  });

  return Response.json({ ok: true });
}

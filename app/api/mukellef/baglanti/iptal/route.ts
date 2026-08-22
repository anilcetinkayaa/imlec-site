// Bağlantı iptali: iki taraftan biri bağı koparabilir (REVOKED).
// İptal sonrası paket gönderimi durur; geçmiş paketler muhasebecide kalır.

import { TaxpayerLinkStatus } from "@prisma/client";
import { prisma } from "@/src/db/prisma";
import {
  authenticateDesktopUser,
  bridgeError,
  linkSummary,
} from "@/src/server/taxpayer-bridge";

export const runtime = "nodejs";

type IptalBody = { linkId: string };

function isIptalBody(value: unknown): value is IptalBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "linkId" in value &&
    typeof (value as { linkId: unknown }).linkId === "string"
  );
}

export async function POST(request: Request) {
  const auth = await authenticateDesktopUser(request);

  if (!auth.ok) {
    return auth.response;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return bridgeError("INVALID_BODY", 400);
  }

  if (!isIptalBody(body)) {
    return bridgeError("INVALID_BODY", 400);
  }

  const link = await prisma.taxpayerLink.findUnique({
    where: { id: body.linkId },
  });

  if (!link) {
    return bridgeError("LINK_NOT_FOUND", 404);
  }

  if (
    link.jewelerUserId !== auth.user.id &&
    link.accountantUserId !== auth.user.id
  ) {
    return bridgeError("NOT_LINK_MEMBER", 403);
  }

  if (link.status === TaxpayerLinkStatus.REVOKED) {
    return Response.json({ ok: true, link: linkSummary(link) });
  }

  const guncel = await prisma.taxpayerLink.update({
    where: { id: link.id },
    data: {
      status: TaxpayerLinkStatus.REVOKED,
      revokedAt: new Date(),
    },
  });

  return Response.json({ ok: true, link: linkSummary(guncel) });
}

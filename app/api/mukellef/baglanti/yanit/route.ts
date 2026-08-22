// Muhasebecinin bağlantı isteğine yanıtı: onay veya red.
// Yalnız isteğin muhasebeci tarafı yanıtlayabilir; FIS260 erişimi şarttır.

import { TaxpayerLinkStatus } from "@prisma/client";
import { prisma } from "@/src/db/prisma";
import {
  ACCOUNTANT_PRODUCT_SLUG,
  authenticateDesktopUser,
  bridgeError,
  linkSummary,
  userHasProduct,
} from "@/src/server/taxpayer-bridge";

export const runtime = "nodejs";

type YanitBody = { linkId: string; approve: boolean };

function isYanitBody(value: unknown): value is YanitBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "linkId" in value &&
    "approve" in value &&
    typeof (value as { linkId: unknown }).linkId === "string" &&
    typeof (value as { approve: unknown }).approve === "boolean"
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

  if (!isYanitBody(body)) {
    return bridgeError("INVALID_BODY", 400);
  }

  const link = await prisma.taxpayerLink.findUnique({
    where: { id: body.linkId },
  });

  if (!link) {
    return bridgeError("LINK_NOT_FOUND", 404);
  }

  if (link.accountantUserId !== auth.user.id) {
    return bridgeError("NOT_LINK_ACCOUNTANT", 403);
  }

  if (link.status !== TaxpayerLinkStatus.PENDING) {
    return bridgeError("LINK_NOT_PENDING", 409);
  }

  if (!(await userHasProduct(auth.user.id, ACCOUNTANT_PRODUCT_SLUG))) {
    return bridgeError("FIS260_ACCESS_REQUIRED", 403);
  }

  const guncel = await prisma.taxpayerLink.update({
    where: { id: link.id },
    data: {
      status: body.approve
        ? TaxpayerLinkStatus.ACTIVE
        : TaxpayerLinkStatus.REJECTED,
      respondedAt: new Date(),
    },
    include: { jeweler: { select: { email: true, name: true } } },
  });

  return Response.json({ ok: true, link: linkSummary(guncel) });
}

// Mükellef Köprüsü ortak yardımcıları.
// Kural: paketler YALNIZ ACTIVE bağlantı üzerinden akar; kuyumcu tarafı
// KUYVERA, muhasebeci tarafı FIS260 erişimi ister — rastgele gönderim yok.

import { prisma } from "@/src/db/prisma";
import { getUserProductAccess } from "@/src/server/entitlements";
import { getBearerToken, verifyDesktopToken } from "@/src/server/desktop-token";

export const JEWELER_PRODUCT_SLUG = "kuyvera";
export const ACCOUNTANT_PRODUCT_SLUG = "fis260";

export type BridgeUser = {
  id: string;
  email: string;
  name: string | null;
};

export type BridgeAuthResult =
  | { ok: true; user: BridgeUser }
  | { ok: false; response: Response };

function errorResponse(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

export async function authenticateDesktopUser(
  request: Request,
): Promise<BridgeAuthResult> {
  const token = getBearerToken(request);

  if (!token) {
    return { ok: false, response: errorResponse("MISSING_TOKEN", 401) };
  }

  const payload = verifyDesktopToken(token);

  if (!payload) {
    return { ok: false, response: errorResponse("INVALID_TOKEN", 401) };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, disabledAt: true },
  });

  if (!user || user.disabledAt) {
    return { ok: false, response: errorResponse("USER_NOT_FOUND", 404) };
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
  };
}

export async function userHasProduct(userId: string, slug: string) {
  const products = await getUserProductAccess(userId);
  return products.some((item) => item.slug === slug && item.hasAccess);
}

export function bridgeError(error: string, status: number) {
  return errorResponse(error, status);
}

export function linkSummary(link: {
  id: string;
  status: string;
  businessName: string | null;
  businessVkn: string | null;
  requestNote: string | null;
  respondedAt: Date | null;
  createdAt: Date;
  jeweler?: { email: string; name: string | null };
  accountant?: { email: string; name: string | null };
}) {
  return {
    id: link.id,
    status: link.status,
    businessName: link.businessName,
    businessVkn: link.businessVkn,
    requestNote: link.requestNote,
    respondedAt: link.respondedAt,
    createdAt: link.createdAt,
    jeweler: link.jeweler ?? null,
    accountant: link.accountant ?? null,
  };
}

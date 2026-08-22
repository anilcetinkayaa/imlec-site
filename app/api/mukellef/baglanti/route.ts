// Mükellef bağlantıları: kuyumcu -> muhasebeci eşleştirme istekleri.
// GET  : iki roldeki bağlantılarımı listele (KUYVERA ve FIS260 tarafı)
// POST : kuyumcu, muhasebecisinin e-postasıyla bağlantı isteği açar

import { TaxpayerLinkStatus } from "@prisma/client";
import { prisma } from "@/src/db/prisma";
import {
  ACCOUNTANT_PRODUCT_SLUG,
  JEWELER_PRODUCT_SLUG,
  authenticateDesktopUser,
  bridgeError,
  linkSummary,
  userHasProduct,
} from "@/src/server/taxpayer-bridge";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await authenticateDesktopUser(request);

  if (!auth.ok) {
    return auth.response;
  }

  const [asJeweler, asAccountant] = await Promise.all([
    prisma.taxpayerLink.findMany({
      where: { jewelerUserId: auth.user.id },
      include: { accountant: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.taxpayerLink.findMany({
      where: { accountantUserId: auth.user.id },
      include: { jeweler: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return Response.json({
    ok: true,
    asJeweler: asJeweler.map(linkSummary),
    asAccountant: asAccountant.map(linkSummary),
  });
}

type CreateBody = {
  accountantEmail: string;
  businessName?: string;
  businessVkn?: string;
  note?: string;
};

function isCreateBody(value: unknown): value is CreateBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "accountantEmail" in value &&
    typeof (value as { accountantEmail: unknown }).accountantEmail === "string"
  );
}

export async function POST(request: Request) {
  const auth = await authenticateDesktopUser(request);

  if (!auth.ok) {
    return auth.response;
  }

  if (!(await userHasProduct(auth.user.id, JEWELER_PRODUCT_SLUG))) {
    return bridgeError("KUYVERA_ACCESS_REQUIRED", 403);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return bridgeError("INVALID_BODY", 400);
  }

  if (!isCreateBody(body)) {
    return bridgeError("INVALID_BODY", 400);
  }

  const accountantEmail = body.accountantEmail.trim();

  if (!accountantEmail) {
    return bridgeError("INVALID_BODY", 400);
  }

  const accountant = await prisma.user.findFirst({
    where: { email: { equals: accountantEmail, mode: "insensitive" } },
    select: { id: true, email: true, name: true, disabledAt: true },
  });

  if (!accountant || accountant.disabledAt) {
    return bridgeError("ACCOUNTANT_NOT_FOUND", 404);
  }

  if (accountant.id === auth.user.id) {
    return bridgeError("SELF_LINK_NOT_ALLOWED", 400);
  }

  if (!(await userHasProduct(accountant.id, ACCOUNTANT_PRODUCT_SLUG))) {
    return bridgeError("ACCOUNTANT_HAS_NO_FIS260", 409);
  }

  // Muhasebeci değişikliği bilinçli olmalı: başka bir muhasebeciyle
  // bekleyen/aktif bağlantı varken yeni istek açılamaz — önce koparılır.
  const mevcutBaglanti = await prisma.taxpayerLink.findFirst({
    where: {
      jewelerUserId: auth.user.id,
      status: { in: [TaxpayerLinkStatus.PENDING, TaxpayerLinkStatus.ACTIVE] },
      NOT: { accountantUserId: accountant.id },
    },
    include: { accountant: { select: { email: true } } },
  });

  if (mevcutBaglanti) {
    return Response.json(
      {
        ok: false,
        error: "ANOTHER_LINK_ACTIVE",
        currentAccountant: mevcutBaglanti.accountant.email,
        currentStatus: mevcutBaglanti.status,
      },
      { status: 409 },
    );
  }

  const veriler = {
    businessName: body.businessName?.trim() || null,
    businessVkn: body.businessVkn?.trim() || null,
    requestNote: body.note?.trim() || null,
  };

  const existing = await prisma.taxpayerLink.findUnique({
    where: {
      jewelerUserId_accountantUserId: {
        jewelerUserId: auth.user.id,
        accountantUserId: accountant.id,
      },
    },
  });

  if (existing) {
    if (
      existing.status === TaxpayerLinkStatus.PENDING ||
      existing.status === TaxpayerLinkStatus.ACTIVE
    ) {
      return Response.json(
        { ok: false, error: "LINK_ALREADY_EXISTS", status: existing.status },
        { status: 409 },
      );
    }

    // REJECTED / REVOKED bağlantı yeniden istek olarak açılır
    const yenilenen = await prisma.taxpayerLink.update({
      where: { id: existing.id },
      data: {
        ...veriler,
        status: TaxpayerLinkStatus.PENDING,
        respondedAt: null,
        revokedAt: null,
      },
      include: { accountant: { select: { email: true, name: true } } },
    });

    return Response.json({ ok: true, link: linkSummary(yenilenen) }, { status: 201 });
  }

  const link = await prisma.taxpayerLink.create({
    data: {
      jewelerUserId: auth.user.id,
      accountantUserId: accountant.id,
      ...veriler,
    },
    include: { accountant: { select: { email: true, name: true } } },
  });

  return Response.json({ ok: true, link: linkSummary(link) }, { status: 201 });
}

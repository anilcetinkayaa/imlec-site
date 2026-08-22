// Tek paket: muhasebeci indirir (DOWNLOADED) ve işlendi işaretler (PROCESSED).
// Yalnız paketin bağlantısındaki muhasebeci erişebilir.

import { TaxpayerPackageStatus } from "@prisma/client";
import { prisma } from "@/src/db/prisma";
import {
  authenticateDesktopUser,
  bridgeError,
} from "@/src/server/taxpayer-bridge";

export const runtime = "nodejs";

async function paketiGetir(paketId: string) {
  return prisma.taxpayerPackage.findUnique({
    where: { id: paketId },
    include: {
      link: {
        select: {
          id: true,
          accountantUserId: true,
          businessName: true,
          businessVkn: true,
          jeweler: { select: { email: true, name: true } },
        },
      },
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ paketId: string }> },
) {
  const auth = await authenticateDesktopUser(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { paketId } = await params;
  const paket = await paketiGetir(paketId);

  if (!paket) {
    return bridgeError("PACKAGE_NOT_FOUND", 404);
  }

  if (paket.link.accountantUserId !== auth.user.id) {
    return bridgeError("NOT_PACKAGE_ACCOUNTANT", 403);
  }

  if (paket.status === TaxpayerPackageStatus.RECEIVED) {
    await prisma.taxpayerPackage.update({
      where: { id: paket.id },
      data: {
        status: TaxpayerPackageStatus.DOWNLOADED,
        downloadedAt: new Date(),
      },
    });
  }

  return Response.json({
    ok: true,
    meta: {
      id: paket.id,
      linkId: paket.link.id,
      businessName: paket.link.businessName,
      businessVkn: paket.link.businessVkn,
      jeweler: paket.link.jeweler,
      period: paket.period,
      schemaVersion: paket.schemaVersion,
      documentCount: paket.documentCount,
      entryCount: paket.entryCount,
      createdAt: paket.createdAt,
    },
    package: paket.payload,
  });
}

type DurumBody = { status: "PROCESSED" };

function isDurumBody(value: unknown): value is DurumBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    (value as { status: unknown }).status === "PROCESSED"
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ paketId: string }> },
) {
  const auth = await authenticateDesktopUser(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { paketId } = await params;
  const paket = await paketiGetir(paketId);

  if (!paket) {
    return bridgeError("PACKAGE_NOT_FOUND", 404);
  }

  if (paket.link.accountantUserId !== auth.user.id) {
    return bridgeError("NOT_PACKAGE_ACCOUNTANT", 403);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return bridgeError("INVALID_BODY", 400);
  }

  if (!isDurumBody(body)) {
    return bridgeError("INVALID_BODY", 400);
  }

  const guncel = await prisma.taxpayerPackage.update({
    where: { id: paket.id },
    data: {
      status: TaxpayerPackageStatus.PROCESSED,
      processedAt: new Date(),
    },
    select: { id: true, status: true, processedAt: true },
  });

  return Response.json({ ok: true, package: guncel });
}

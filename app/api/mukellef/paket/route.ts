// Mükellef paketleri.
// POST : kuyumcu, KUYVERA paketini AKTİF bağlantısına yükler
// GET  : muhasebeci, mükelleflerinden gelen paketleri listeler
// Kural: paket yalnız ACTIVE bağlantı üzerinden akar — rastgele gönderim yok.

import { TaxpayerLinkStatus, TaxpayerPackageStatus } from "@prisma/client";
import { prisma } from "@/src/db/prisma";
import {
  JEWELER_PRODUCT_SLUG,
  authenticateDesktopUser,
  bridgeError,
  userHasProduct,
} from "@/src/server/taxpayer-bridge";

export const runtime = "nodejs";

const PAKET_BOYUT_SINIRI = 8_000_000; // ~8 MB JSON (görseller pakete girmez)

type PaketBody = {
  linkId: string;
  package: Record<string, unknown>;
};

function isPaketBody(value: unknown): value is PaketBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "linkId" in value &&
    "package" in value &&
    typeof (value as { linkId: unknown }).linkId === "string" &&
    typeof (value as { package: unknown }).package === "object" &&
    (value as { package: unknown }).package !== null
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

  const ham = await request.text();

  if (ham.length > PAKET_BOYUT_SINIRI) {
    return bridgeError("PACKAGE_TOO_LARGE", 413);
  }

  let body: unknown;

  try {
    body = JSON.parse(ham);
  } catch {
    return bridgeError("INVALID_BODY", 400);
  }

  if (!isPaketBody(body)) {
    return bridgeError("INVALID_BODY", 400);
  }

  const link = await prisma.taxpayerLink.findUnique({
    where: { id: body.linkId },
  });

  if (!link) {
    return bridgeError("LINK_NOT_FOUND", 404);
  }

  if (link.jewelerUserId !== auth.user.id) {
    return bridgeError("NOT_LINK_JEWELER", 403);
  }

  if (link.status !== TaxpayerLinkStatus.ACTIVE) {
    return bridgeError("LINK_NOT_ACTIVE", 403);
  }

  const paket = body.package;
  const format = paket.format;

  if (format !== "KUYVERA_PAKET") {
    return bridgeError("UNSUPPORTED_PACKAGE_FORMAT", 400);
  }

  const surum = Number.parseInt(String(paket.schema_version ?? "1"), 10);
  const belgeler = Array.isArray(paket.belgeler) ? paket.belgeler : [];
  const islemler = Array.isArray(paket.islemler) ? paket.islemler : [];

  const kayit = await prisma.taxpayerPackage.create({
    data: {
      linkId: link.id,
      schemaVersion: Number.isFinite(surum) ? surum : 1,
      period: typeof paket.donem === "string" ? paket.donem : null,
      documentCount: belgeler.length,
      entryCount: islemler.length,
      payload: paket as object,
    },
    select: { id: true, status: true, createdAt: true },
  });

  return Response.json(
    {
      ok: true,
      packageId: kayit.id,
      status: kayit.status,
      createdAt: kayit.createdAt,
    },
    { status: 201 },
  );
}

export async function GET(request: Request) {
  const auth = await authenticateDesktopUser(request);

  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const durumParametresi = url.searchParams.get("status");
  const durum =
    durumParametresi &&
    (Object.values(TaxpayerPackageStatus) as string[]).includes(durumParametresi)
      ? (durumParametresi as TaxpayerPackageStatus)
      : undefined;

  const paketler = await prisma.taxpayerPackage.findMany({
    where: {
      link: { accountantUserId: auth.user.id },
      ...(durum ? { status: durum } : {}),
    },
    include: {
      link: {
        select: {
          id: true,
          businessName: true,
          businessVkn: true,
          status: true,
          jeweler: { select: { email: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return Response.json({
    ok: true,
    packages: paketler.map((paket) => ({
      id: paket.id,
      linkId: paket.linkId,
      businessName: paket.link.businessName,
      businessVkn: paket.link.businessVkn,
      jeweler: paket.link.jeweler,
      period: paket.period,
      schemaVersion: paket.schemaVersion,
      documentCount: paket.documentCount,
      entryCount: paket.entryCount,
      status: paket.status,
      createdAt: paket.createdAt,
      downloadedAt: paket.downloadedAt,
      processedAt: paket.processedAt,
    })),
  });
}

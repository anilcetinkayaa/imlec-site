import { EntitlementStatus } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/src/db/prisma";

const DOWNLOAD_URLS: Record<string, string> = {
  fis260:
    process.env.FIS260_DOWNLOAD_URL ??
    "https://github.com/anilcetinkayaa/imlec-site/releases/download/v0.1.0-beta/FIS260_Setup_v0.1.0.exe",
};

type DownloadRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}

async function writeDownloadLog({
  request,
  userId,
  productSlug,
  success,
  reason,
}: {
  request: NextRequest;
  userId?: string;
  productSlug: string;
  success: boolean;
  reason?: string;
}) {
  try {
    await prisma.downloadLog.create({
      data: {
        userId,
        productSlug,
        success,
        reason,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent"),
      },
    });
  } catch (error) {
    console.error("[DOWNLOAD LOG ERROR]", error);
  }
}

function isEntitlementValid(entitlement: {
  status: EntitlementStatus;
  expiresAt: Date | null;
  revokedAt: Date | null;
}) {
  return (
    (entitlement.status === EntitlementStatus.ACTIVE ||
      entitlement.status === EntitlementStatus.GRACE_PERIOD) &&
    !entitlement.revokedAt &&
    (!entitlement.expiresAt || entitlement.expiresAt > new Date())
  );
}

export async function GET(request: NextRequest, context: DownloadRouteContext) {
  const { slug: rawSlug } = await context.params;
  const slug = rawSlug.toLowerCase();
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    await writeDownloadLog({
      request,
      productSlug: slug,
      success: false,
      reason: "UNAUTHENTICATED",
    });

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
  }

  const product = await prisma.product.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  if (!product) {
    await writeDownloadLog({
      request,
      userId,
      productSlug: slug,
      success: false,
      reason: "PRODUCT_NOT_FOUND",
    });

    return NextResponse.json({ ok: false, error: "PRODUCT_NOT_FOUND" }, { status: 404 });
  }

  const downloadUrl = DOWNLOAD_URLS[product.slug];

  if (!downloadUrl) {
    await writeDownloadLog({
      request,
      userId,
      productSlug: product.slug,
      success: false,
      reason: "DOWNLOAD_URL_MISSING",
    });

    return NextResponse.json({ ok: false, error: "DOWNLOAD_URL_MISSING" }, { status: 404 });
  }

  const entitlement = await prisma.entitlement.findUnique({
    where: {
      userId_productId: {
        userId,
        productId: product.id,
      },
    },
    select: {
      status: true,
      expiresAt: true,
      revokedAt: true,
    },
  });

  if (!entitlement || !isEntitlementValid(entitlement)) {
    await writeDownloadLog({
      request,
      userId,
      productSlug: product.slug,
      success: false,
      reason: entitlement ? "ENTITLEMENT_INVALID" : "ENTITLEMENT_NOT_FOUND",
    });

    return NextResponse.redirect(new URL("/fis260#uyelikler", request.url));
  }

  await writeDownloadLog({
    request,
    userId,
    productSlug: product.slug,
    success: true,
    reason: "ENTITLEMENT_VALID",
  });

  return NextResponse.redirect(downloadUrl);
}

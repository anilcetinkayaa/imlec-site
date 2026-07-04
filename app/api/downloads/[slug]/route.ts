import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/src/db/prisma";
import {
  isEntitlementUsable,
  selectBestEntitlement,
} from "@/src/server/entitlement-helpers";

const DOWNLOAD_URLS: Record<string, string> = {
  launcher:
    process.env.LAUNCHER_DOWNLOAD_URL ??
    "https://github.com/anilcetinkayaa/imlec-site/releases/download/v0.1.1-launcher/ImlecLauncher-0.1.6-windows-x64.zip",
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

export async function GET(request: NextRequest, context: DownloadRouteContext) {
  const { slug: rawSlug } = await context.params;
  const slug = rawSlug.toLowerCase();
  const session = await auth();
  const userId = session?.user?.id;
  const isPublicLauncher = slug === "launcher";

  if (!userId && !isPublicLauncher) {
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

  if (isPublicLauncher) {
    await writeDownloadLog({
      request,
      userId,
      productSlug: product.slug,
      success: true,
      reason: "PUBLIC_LAUNCHER_DOWNLOAD",
    });

    return NextResponse.redirect(downloadUrl);
  }

  const authenticatedUserId = userId;

  if (!authenticatedUserId) {
    await writeDownloadLog({
      request,
      productSlug: product.slug,
      success: false,
      reason: "UNAUTHENTICATED",
    });

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
  }

  const entitlements = await prisma.entitlement.findMany({
    where: {
      userId: authenticatedUserId,
      productId: product.id,
    },
    select: {
      status: true,
      expiresAt: true,
      revokedAt: true,
    },
  });

  const entitlement = selectBestEntitlement(entitlements);

  if (!entitlement || !isEntitlementUsable(entitlement)) {
    await writeDownloadLog({
      request,
      userId: authenticatedUserId,
      productSlug: product.slug,
      success: false,
      reason: entitlement ? "ENTITLEMENT_INVALID" : "ENTITLEMENT_NOT_FOUND",
    });

    const accessUrl = new URL("/download", request.url);
    accessUrl.searchParams.set("reason", "access-required");
    accessUrl.searchParams.set("product", product.slug);

    return NextResponse.redirect(accessUrl);
  }

  await writeDownloadLog({
    request,
    userId: authenticatedUserId,
    productSlug: product.slug,
    success: true,
    reason: "ENTITLEMENT_VALID",
  });

  return NextResponse.redirect(downloadUrl);
}

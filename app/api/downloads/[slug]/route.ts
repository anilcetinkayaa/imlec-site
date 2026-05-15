import { EntitlementStatus, UserRole } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/src/db/prisma";
import { createInstallerSignedUrl } from "@/src/server/r2-downloads";

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

async function createInstallerRedirect({
  request,
  userId,
  productSlug,
  filePath,
  downloadName,
  successReason,
}: {
  request: NextRequest;
  userId: string;
  productSlug: string;
  filePath: string;
  downloadName: string;
  successReason: string;
}) {
  try {
    const installerUrl = await createInstallerSignedUrl({
      filePath,
      downloadName,
    });

    await writeDownloadLog({
      request,
      userId,
      productSlug,
      success: true,
      reason: successReason,
    });

    return NextResponse.redirect(installerUrl);
  } catch (error) {
    await writeDownloadLog({
      request,
      userId,
      productSlug,
      success: false,
      reason: error instanceof Error ? error.message : "SIGNED_URL_ERROR",
    });

    return NextResponse.json({ ok: false, error: "SIGNED_URL_ERROR" }, { status: 503 });
  }
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

    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const product = await prisma.product.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      slug: true,
      name: true,
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

  const productVersion = await prisma.productVersion.findFirst({
    where: {
      productId: product.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      filePath: true,
      version: true,
    },
  });

  if (!productVersion) {
    await writeDownloadLog({
      request,
      userId,
      productSlug: product.slug,
      success: false,
      reason: "PRODUCT_VERSION_NOT_FOUND",
    });

    return NextResponse.json({ ok: false, error: "PRODUCT_VERSION_NOT_FOUND" }, { status: 404 });
  }

  const downloadName = `${product.name}_Setup_v${productVersion.version}.exe`;

  if (session.user.role === UserRole.ADMIN) {
    return createInstallerRedirect({
      request,
      userId,
      productSlug: product.slug,
      filePath: productVersion.filePath,
      downloadName,
      successReason: "ADMIN_BYPASS",
    });
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

    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  return createInstallerRedirect({
    request,
    userId,
    productSlug: product.slug,
    filePath: productVersion.filePath,
    downloadName,
    successReason: "ENTITLEMENT_VALID",
  });
}

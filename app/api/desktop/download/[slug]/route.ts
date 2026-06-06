import { createHmac, timingSafeEqual } from "node:crypto";
import { EntitlementStatus } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/src/db/prisma";

export const runtime = "nodejs";

type DesktopDownloadPayload = {
  sub: string;
  product: string;
  version: string;
  exp: number;
};

type DesktopDownloadContext = {
  params: Promise<{
    slug: string;
  }>;
};

function jsonError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}

function isDesktopDownloadPayload(value: unknown): value is DesktopDownloadPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "sub" in value &&
    "product" in value &&
    "version" in value &&
    "exp" in value &&
    typeof value.sub === "string" &&
    typeof value.product === "string" &&
    typeof value.version === "string" &&
    typeof value.exp === "number"
  );
}

function verifyDownloadToken(token: string) {
  const secret = process.env.DESKTOP_AUTH_SECRET;

  if (!secret) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as unknown;
    if (!isDesktopDownloadPayload(payload)) {
      return null;
    }
    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function entitlementIsActive(entitlement: {
  status: EntitlementStatus;
  expiresAt: Date | null;
  revokedAt: Date | null;
} | null) {
  return (
    (entitlement?.status === EntitlementStatus.ACTIVE ||
      entitlement?.status === EntitlementStatus.GRACE_PERIOD) &&
    !entitlement.revokedAt &&
    (!entitlement.expiresAt || entitlement.expiresAt > new Date())
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
  reason: string;
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
    console.error("[DESKTOP DOWNLOAD LOG ERROR]", error);
  }
}

export async function GET(request: NextRequest, context: DesktopDownloadContext) {
  const { slug: rawSlug } = await context.params;
  const slug = rawSlug.toLowerCase();
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const payload = verifyDownloadToken(token);

  if (!payload || payload.product.toLowerCase() !== slug) {
    await writeDownloadLog({
      request,
      productSlug: slug,
      success: false,
      reason: "DESKTOP_DOWNLOAD_INVALID_TOKEN",
    });
    return jsonError("INVALID_TOKEN", 401);
  }

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, slug: true },
  });

  if (!product) {
    await writeDownloadLog({
      request,
      userId: payload.sub,
      productSlug: slug,
      success: false,
      reason: "DESKTOP_DOWNLOAD_PRODUCT_NOT_FOUND",
    });
    return jsonError("PRODUCT_NOT_FOUND", 404);
  }

  const entitlement = await prisma.entitlement.findUnique({
    where: {
      userId_productId: {
        userId: payload.sub,
        productId: product.id,
      },
    },
    select: {
      status: true,
      expiresAt: true,
      revokedAt: true,
    },
  });

  if (slug !== "launcher" && !entitlementIsActive(entitlement)) {
    await writeDownloadLog({
      request,
      userId: payload.sub,
      productSlug: slug,
      success: false,
      reason: "DESKTOP_DOWNLOAD_ENTITLEMENT_INVALID",
    });
    return jsonError("ENTITLEMENT_INACTIVE", 403);
  }

  const version = await prisma.productVersion.findUnique({
    where: {
      productId_version: {
        productId: product.id,
        version: payload.version,
      },
    },
    select: {
      filePath: true,
      sha256: true,
    },
  });

  if (!version) {
    await writeDownloadLog({
      request,
      userId: payload.sub,
      productSlug: slug,
      success: false,
      reason: "DESKTOP_DOWNLOAD_VERSION_NOT_FOUND",
    });
    return jsonError("VERSION_NOT_FOUND", 404);
  }

  await writeDownloadLog({
    request,
    userId: payload.sub,
    productSlug: slug,
    success: true,
    reason: "DESKTOP_DOWNLOAD_TOKEN_VALID",
  });

  const downloadUrl = version.filePath.startsWith("http")
    ? version.filePath
    : new URL(`/downloads/${version.filePath}`, request.url).toString();

  return NextResponse.redirect(downloadUrl);
}

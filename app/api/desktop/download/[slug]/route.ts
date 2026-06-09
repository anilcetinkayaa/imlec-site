import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { DeviceStatus, EntitlementStatus, SessionType } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/src/db/prisma";
import {
  isEntitlementUsable,
  selectBestEntitlement,
} from "@/src/server/entitlement-helpers";

export const runtime = "nodejs";

type DesktopDownloadPayload = {
  sub: string;
  product: string;
  version: string;
  device?: string;
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
    (!("device" in value) || typeof value.device === "string") &&
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
  return entitlement ? isEntitlementUsable(entitlement) : false;
}

async function desktopDeviceCanDownload({
  token,
  userId,
  productId,
  deviceId,
}: {
  token: string;
  userId: string;
  productId: string;
  deviceId: string | null;
}) {
  if (!deviceId) {
    return { allowed: false, status: "DEVICE_REQUIRED" };
  }

  const device = await prisma.device.findUnique({
    where: {
      userId_productId_fingerprintHash: {
        userId,
        productId,
        fingerprintHash: deviceId,
      },
    },
    select: {
      id: true,
      status: true,
      revokedAt: true,
    },
  });

  if (!device) {
    return { allowed: false, status: "DEVICE_NOT_REGISTERED" };
  }

  if (device.status !== DeviceStatus.ACTIVE || device.revokedAt) {
    return { allowed: false, status: "DEVICE_REVOKED" };
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      deviceId: true,
      type: true,
      expiresAt: true,
      revokedAt: true,
    },
  });

  if (
    !session ||
    session.type !== SessionType.DESKTOP ||
    session.deviceId !== device.id ||
    session.revokedAt ||
    session.expiresAt <= new Date()
  ) {
    return { allowed: false, status: "SESSION_INVALID" };
  }

  await prisma.$transaction([
    prisma.device.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    }),
    prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    }),
  ]);

  return { allowed: true, status: "ACTIVE" };
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

  const entitlements = await prisma.entitlement.findMany({
    where: {
      userId: payload.sub,
      productId: product.id,
    },
    select: {
      status: true,
      expiresAt: true,
      revokedAt: true,
    },
  });
  const entitlement = selectBestEntitlement(entitlements);

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

  if (slug !== "launcher") {
    const deviceGate = await desktopDeviceCanDownload({
      token,
      userId: payload.sub,
      productId: product.id,
      deviceId: payload.device?.trim() || null,
    });

    if (!deviceGate.allowed) {
      await writeDownloadLog({
        request,
        userId: payload.sub,
        productSlug: slug,
        success: false,
        reason: `DESKTOP_DOWNLOAD_${deviceGate.status}`,
      });
      return jsonError(deviceGate.status, 403);
    }
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

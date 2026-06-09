import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { DeviceStatus, EntitlementStatus, SessionType } from "@prisma/client";
import { createElement } from "react";
import { NewDeviceActivatedEmail } from "@/emails/NewDeviceActivatedEmail";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/src/db/prisma";
import {
  isEntitlementUsable,
  selectBestEntitlement,
} from "@/src/server/entitlement-helpers";

export const runtime = "nodejs";

type DesktopTokenPayload = {
  sub: string;
  email: string;
  role: string;
  type: "desktop-access";
  exp: number;
};

type DeviceRegisterBody = {
  deviceId: string;
  deviceName?: string;
  os?: string;
  appVersion?: string;
};

function jsonError(error: string, status: number) {
  return Response.json(
    {
      ok: false,
      error,
    },
    {
      status,
    },
  );
}

function isDeviceRegisterBody(value: unknown): value is DeviceRegisterBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "deviceId" in value &&
    typeof value.deviceId === "string" &&
    (!("deviceName" in value) || typeof value.deviceName === "string") &&
    (!("os" in value) || typeof value.os === "string") &&
    (!("appVersion" in value) || typeof value.appVersion === "string")
  );
}

function isDesktopTokenPayload(value: unknown): value is DesktopTokenPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "sub" in value &&
    "email" in value &&
    "role" in value &&
    "type" in value &&
    "exp" in value &&
    typeof value.sub === "string" &&
    typeof value.email === "string" &&
    typeof value.role === "string" &&
    value.type === "desktop-access" &&
    typeof value.exp === "number"
  );
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function verifyDesktopToken(token: string) {
  const secret = process.env.DESKTOP_AUTH_SECRET;

  if (!secret) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(unsignedToken)
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
    const header = JSON.parse(base64UrlDecode(encodedHeader)) as unknown;
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as unknown;

    if (
      typeof header !== "object" ||
      header === null ||
      !("alg" in header) ||
      header.alg !== "HS256"
    ) {
      return null;
    }

    if (!isDesktopTokenPayload(payload)) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);

    if (payload.exp <= now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function cleanOptionalText(value: string | undefined) {
  const text = value?.trim();
  return text ? text.slice(0, 255) : null;
}

function desktopDeviceLimit() {
  const parsed = Number.parseInt(process.env.FIS260_DESKTOP_DEVICE_LIMIT ?? "3", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
}

function desktopDeviceAccountLimit() {
  const parsed = Number.parseInt(process.env.FIS260_DEVICE_ACCOUNT_LIMIT ?? "2", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
}

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}

async function writeSecurityLog({
  request,
  userId,
  reason,
}: {
  request: Request;
  userId?: string;
  reason: string;
}) {
  try {
    await prisma.downloadLog.create({
      data: {
        userId,
        productSlug: "fis260",
        success: false,
        reason,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent"),
      },
    });
  } catch (error) {
    console.error("[DESKTOP SECURITY LOG ERROR]", error);
  }
}

function offlineTrustedUntil() {
  const days = Number.parseInt(process.env.FIS260_OFFLINE_GRACE_DAYS ?? "7", 10);
  const safeDays = Number.isFinite(days) && days > 0 ? days : 7;
  return new Date(Date.now() + safeDays * 24 * 60 * 60 * 1000);
}

function entitlementIsActive(entitlement: {
  status: EntitlementStatus;
  expiresAt: Date | null;
  revokedAt: Date | null;
} | null) {
  return entitlement ? isEntitlementUsable(entitlement) : false;
}

export async function POST(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return jsonError("INVALID_TOKEN", 401);
  }

  const tokenPayload = verifyDesktopToken(token);

  if (!tokenPayload) {
    return jsonError("INVALID_TOKEN", 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_BODY", 400);
  }

  if (!isDeviceRegisterBody(body)) {
    return jsonError("INVALID_BODY", 400);
  }

  const deviceId = body.deviceId.trim();

  if (!deviceId) {
    return jsonError("INVALID_BODY", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: tokenPayload.sub },
    select: {
      id: true,
      email: true,
      disabledAt: true,
    },
  });

  if (!user || user.disabledAt) {
    return jsonError("INVALID_TOKEN", 401);
  }

  const product = await prisma.product.findUnique({
    where: { slug: "fis260" },
    select: { id: true },
  });

  if (!product) {
    return jsonError("PRODUCT_NOT_FOUND", 404);
  }

  const existingDevice = await prisma.device.findUnique({
    where: {
      userId_productId_fingerprintHash: {
        userId: user.id,
        productId: product.id,
        fingerprintHash: deviceId,
      },
    },
    select: {
      id: true,
      status: true,
      revokedAt: true,
    },
  });

  if (existingDevice?.status === DeviceStatus.REVOKED || existingDevice?.revokedAt) {
    await writeSecurityLog({
      request,
      userId: user.id,
      reason: "DEVICE_REVOKED_REGISTER_ATTEMPT",
    });
    return jsonError("DEVICE_REVOKED", 403);
  }

  const entitlements = await prisma.entitlement.findMany({
    where: {
      userId: user.id,
      productId: product.id,
    },
    select: {
      status: true,
      expiresAt: true,
      revokedAt: true,
    },
  });
  const entitlement = selectBestEntitlement(entitlements);

  if (!entitlementIsActive(entitlement)) {
    await writeSecurityLog({
      request,
      userId: user.id,
      reason: "ENTITLEMENT_INACTIVE_REGISTER_ATTEMPT",
    });
    return jsonError("ENTITLEMENT_INACTIVE", 403);
  }

  const accountLimit = desktopDeviceAccountLimit();
  const otherAccountCount = await prisma.device.count({
    where: {
      productId: product.id,
      fingerprintHash: deviceId,
      userId: {
        not: user.id,
      },
      status: DeviceStatus.ACTIVE,
      revokedAt: null,
    },
  });

  if (otherAccountCount >= accountLimit) {
    await writeSecurityLog({
      request,
      userId: user.id,
      reason: "DEVICE_SHARED_ACROSS_TOO_MANY_ACCOUNTS",
    });
    return Response.json(
      {
        ok: false,
        error: "DEVICE_SHARED_SUSPICIOUS",
        accountLimit,
      },
      { status: 403 },
    );
  }

  const deviceLimit = desktopDeviceLimit();
  if (!existingDevice) {
    const activeDeviceCount = await prisma.device.count({
      where: {
        userId: user.id,
        productId: product.id,
        status: DeviceStatus.ACTIVE,
        revokedAt: null,
      },
    });

    if (activeDeviceCount >= deviceLimit) {
      return Response.json(
        {
          ok: false,
          error: "DEVICE_LIMIT_REACHED",
          deviceLimit,
          activeDeviceCount,
        },
        { status: 403 },
      );
    }
  }

  const trustedUntil = offlineTrustedUntil();

  const registeredDevice = await prisma.device.upsert({
    where: {
      userId_productId_fingerprintHash: {
        userId: user.id,
        productId: product.id,
        fingerprintHash: deviceId,
      },
    },
    update: {
      deviceName: cleanOptionalText(body.deviceName),
      os: cleanOptionalText(body.os),
      appVersion: cleanOptionalText(body.appVersion),
      status: DeviceStatus.ACTIVE,
      lastSeenAt: new Date(),
      trustedUntil,
    },
    create: {
      userId: user.id,
      productId: product.id,
      fingerprintHash: deviceId,
      deviceName: cleanOptionalText(body.deviceName),
      os: cleanOptionalText(body.os),
      appVersion: cleanOptionalText(body.appVersion),
      status: DeviceStatus.ACTIVE,
      lastSeenAt: new Date(),
      trustedUntil,
    },
    select: {
      id: true,
    },
  });

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const tokenExpiresAt = new Date(tokenPayload.exp * 1000);

  await prisma.$transaction([
    prisma.session.updateMany({
      where: {
        userId: user.id,
        productId: product.id,
        type: SessionType.DESKTOP,
        revokedAt: null,
        NOT: {
          tokenHash,
        },
      },
      data: {
        revokedAt: new Date(),
      },
    }),
    prisma.session.upsert({
      where: {
        tokenHash,
      },
      update: {
        deviceId: registeredDevice.id,
        expiresAt: tokenExpiresAt,
        revokedAt: null,
        lastUsedAt: new Date(),
      },
      create: {
        userId: user.id,
        productId: product.id,
        deviceId: registeredDevice.id,
        type: SessionType.DESKTOP,
        tokenHash,
        expiresAt: tokenExpiresAt,
        lastUsedAt: new Date(),
      },
    }),
  ]);

  if (!existingDevice) {
    try {
      await sendMail({
        to: user.email,
        subject: "Yeni cihaz hesabınıza bağlandı",
        react: createElement(NewDeviceActivatedEmail, {
          deviceName: cleanOptionalText(body.deviceName),
          productName: "FİŞ260",
        }),
      });
    } catch (error) {
      console.error("[NEW DEVICE EMAIL ERROR]", error);
    }
  }

  return Response.json({
    ok: true,
    deviceLimit,
    trustedUntil: trustedUntil.toISOString(),
  });
}

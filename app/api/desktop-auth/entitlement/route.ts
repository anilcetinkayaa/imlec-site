import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { DeviceStatus, SessionType } from "@prisma/client";
import { prisma } from "@/src/db/prisma";
import { getUserProductAccess } from "@/src/server/entitlements";

export const runtime = "nodejs";

type DesktopTokenPayload = {
  sub: string;
  email: string;
  role: string;
  type: "desktop-access";
  exp: number;
};

function authErrorResponse(error: "MISSING_TOKEN" | "INVALID_TOKEN") {
  return Response.json(
    {
      ok: false,
      error,
    },
    {
      status: 401,
    },
  );
}

function notFoundResponse(error: "USER_NOT_FOUND" | "PRODUCT_NOT_FOUND") {
  return Response.json(
    {
      ok: false,
      error,
    },
    {
      status: 404,
    },
  );
}

function isEntitlementBody(value: unknown): value is {
  productCode: string;
  deviceId?: string;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "productCode" in value &&
    typeof value.productCode === "string" &&
    (!("deviceId" in value) || typeof value.deviceId === "string")
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

function normalizeProductCode(productCode: string) {
  return productCode.trim().toLowerCase();
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

function desktopDeviceLimit() {
  const parsed = Number.parseInt(process.env.FIS260_DESKTOP_DEVICE_LIMIT ?? "3", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
}

function offlineTrustedUntil() {
  const days = Number.parseInt(process.env.FIS260_OFFLINE_GRACE_DAYS ?? "7", 10);
  const safeDays = Number.isFinite(days) && days > 0 ? days : 7;
  return new Date(Date.now() + safeDays * 24 * 60 * 60 * 1000);
}

export async function POST(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return authErrorResponse("MISSING_TOKEN");
  }

  const tokenPayload = verifyDesktopToken(token);

  if (!tokenPayload) {
    return authErrorResponse("INVALID_TOKEN");
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return notFoundResponse("PRODUCT_NOT_FOUND");
  }

  if (!isEntitlementBody(body)) {
    return notFoundResponse("PRODUCT_NOT_FOUND");
  }

  const productSlug = normalizeProductCode(body.productCode);
  const deviceFingerprint = body.deviceId?.trim();

  const user = await prisma.user.findUnique({
    where: { id: tokenPayload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      disabledAt: true,
    },
  });

  if (!user || user.disabledAt) {
    return notFoundResponse("USER_NOT_FOUND");
  }

  const products = await getUserProductAccess(user.id);
  const product = products.find((item) => item.slug === productSlug);

  if (!product) {
    return notFoundResponse("PRODUCT_NOT_FOUND");
  }

  const dbProduct = await prisma.product.findUnique({
    where: { slug: productSlug },
    select: { id: true },
  });

  if (!dbProduct) {
    return notFoundResponse("PRODUCT_NOT_FOUND");
  }

  const deviceLimit = desktopDeviceLimit();
  let deviceAllowed = true;
  let deviceStatus: string | null = null;
  let offlineUntil: string | null = null;

  if (deviceFingerprint) {
    const device = await prisma.device.findUnique({
      where: {
        userId_productId_fingerprintHash: {
          userId: user.id,
          productId: dbProduct.id,
          fingerprintHash: deviceFingerprint,
        },
      },
      select: {
        id: true,
        status: true,
        revokedAt: true,
      },
    });

    if (!device) {
      deviceAllowed = false;
      deviceStatus = "NOT_REGISTERED";
    } else if (device.status !== DeviceStatus.ACTIVE || device.revokedAt) {
      deviceAllowed = false;
      deviceStatus = device.status;
    } else {
      const session = await prisma.session.findUnique({
        where: {
          tokenHash: createHash("sha256").update(token).digest("hex"),
        },
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
        deviceAllowed = false;
        deviceStatus = "SESSION_EXPIRED";
      } else {
      const trustedUntil = offlineTrustedUntil();
        await prisma.$transaction([
          prisma.device.update({
            where: { id: device.id },
            data: {
              lastSeenAt: new Date(),
              trustedUntil,
            },
          }),
          prisma.session.update({
            where: { id: session.id },
            data: {
              lastUsedAt: new Date(),
            },
          }),
        ]);
        deviceStatus = device.status;
        offlineUntil = trustedUntil.toISOString();
      }
    }
  }

  return Response.json({
    ok: true,
    productCode: body.productCode,
    active: product.hasAccess && deviceAllowed,
    subscriptionActive: product.hasAccess,
    deviceAllowed,
    deviceStatus,
    registeredDeviceLimit: deviceLimit,
    offlineUntil,
    entitlementStatus: product.entitlementStatus,
    expiresAt: product.expiresAt,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
}

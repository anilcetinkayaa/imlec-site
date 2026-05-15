import { createHmac, timingSafeEqual } from "node:crypto";
import { DeviceStatus } from "@prisma/client";
import { createElement } from "react";
import { NewDeviceActivatedEmail } from "@/emails/NewDeviceActivatedEmail";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/src/db/prisma";

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
    },
  });

  await prisma.device.upsert({
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
    },
  });

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
  });
}

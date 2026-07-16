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

function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
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
  productSlug,
  reason,
}: {
  request: Request;
  userId?: string;
  productSlug: string;
  reason: string;
}) {
  try {
    await prisma.downloadLog.create({
      data: {
        userId,
        productSlug,
        success: false,
        reason,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent"),
      },
    });
  } catch (error) {
    console.error("[DESKTOP PRODUCT SECURITY LOG ERROR]", error);
  }
}

async function desktopDeviceCanDownload({
  request,
  token,
  userId,
  productId,
  deviceId,
  tokenExpiresAt,
}: {
  request: Request;
  token: string;
  userId: string;
  productId: string;
  deviceId: string | null;
  tokenExpiresAt: Date;
}) {
  if (!deviceId) {
    return { allowed: false, status: "DEVICE_REQUIRED" };
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const deviceName = request.headers.get("x-imlec-device-name")?.trim() || null;
  const os = request.headers.get("x-imlec-os")?.trim() || null;
  const launcherVersion =
    request.headers.get("x-imlec-app-version")?.trim() || null;
  const appVersion =
    request.headers.get("x-imlec-product-version")?.trim() || null;
  let device = await prisma.device.findUnique({
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
    const sharedAccountLimit = Number.parseInt(process.env.FIS260_DEVICE_ACCOUNT_LIMIT ?? "2", 10);
    const safeSharedAccountLimit = Number.isFinite(sharedAccountLimit) && sharedAccountLimit > 0 ? sharedAccountLimit : 2;
    const sharedAccountCount = await prisma.device.count({
      where: {
        productId,
        fingerprintHash: deviceId,
        userId: {
          not: userId,
        },
        status: DeviceStatus.ACTIVE,
        revokedAt: null,
      },
    });
    if (sharedAccountCount >= safeSharedAccountLimit) {
      return { allowed: false, status: "DEVICE_SHARED_SUSPICIOUS" };
    }

    const deviceLimit = Number.parseInt(process.env.FIS260_DESKTOP_DEVICE_LIMIT ?? "3", 10);
    const safeDeviceLimit = Number.isFinite(deviceLimit) && deviceLimit > 0 ? deviceLimit : 3;
    const activeDeviceCount = await prisma.device.count({
      where: {
        userId,
        productId,
        status: DeviceStatus.ACTIVE,
        revokedAt: null,
      },
    });
    if (activeDeviceCount >= safeDeviceLimit) {
      return { allowed: false, status: "DEVICE_LIMIT_REACHED" };
    }

    device = await prisma.device.create({
      data: {
        userId,
        productId,
        fingerprintHash: deviceId,
        deviceName,
        os,
        appVersion,
        launcherVersion,
        status: DeviceStatus.ACTIVE,
        lastSeenAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        revokedAt: true,
      },
    });
  }

  if (device.status !== DeviceStatus.ACTIVE || device.revokedAt) {
    return { allowed: false, status: "DEVICE_REVOKED" };
  }

  await prisma.$transaction([
    prisma.device.update({
      where: { id: device.id },
      data: {
        appVersion,
        launcherVersion,
        lastSeenAt: new Date(),
      },
    }),
    prisma.session.upsert({
      where: { tokenHash },
      update: {
        deviceId: device.id,
        type: SessionType.DESKTOP,
        expiresAt: tokenExpiresAt,
        revokedAt: null,
        lastUsedAt: new Date(),
      },
      create: {
        userId,
        productId,
        deviceId: device.id,
        type: SessionType.DESKTOP,
        tokenHash,
        expiresAt: tokenExpiresAt,
        lastUsedAt: new Date(),
      },
    }),
  ]);

  return { allowed: true, status: "ACTIVE" };
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function signedDownloadUrl(request: Request, params: {
  userId: string;
  productSlug: string;
  version: string;
  deviceId: string;
}) {
  const secret = process.env.DESKTOP_AUTH_SECRET;

  if (!secret) {
    return null;
  }

  const payload = {
    sub: params.userId,
    product: params.productSlug,
    version: params.version,
    device: params.deviceId,
    exp: Math.floor(Date.now() / 1000) + 15 * 60,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
  return new URL(
    `/api/desktop/download/${params.productSlug}?token=${encodedPayload}.${signature}`,
    request.url,
  ).toString();
}

export async function GET(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return jsonError("MISSING_TOKEN", 401);
  }

  const tokenPayload = verifyDesktopToken(token);

  if (!tokenPayload) {
    return jsonError("INVALID_TOKEN", 401);
  }

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
    return jsonError("USER_NOT_FOUND", 404);
  }

  const products = await getUserProductAccess(user.id);
  const requestDeviceId = request.headers.get("x-imlec-device-id")?.trim() || null;
  const productIds = products.map((product) => product.id);
  const versions = await prisma.productVersion.findMany({
    where: {
      productId: {
        in: productIds,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      productId: true,
      version: true,
      minimumVersion: true,
      releaseNotes: true,
      filePath: true,
      sha256: true,
      createdAt: true,
    },
  });

  const latestByProductId = new Map<string, (typeof versions)[number]>();

  for (const version of versions) {
    if (!latestByProductId.has(version.productId)) {
      latestByProductId.set(version.productId, version);
    }
  }

  return Response.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    products: await Promise.all(products.map(async (product) => {
      const latest = latestByProductId.get(product.id);
      const isLauncher = product.slug === "launcher";
      const hasAccess = product.hasAccess || isLauncher;
      const deviceGate = isLauncher || !hasAccess
        ? { allowed: true, status: isLauncher ? "PUBLIC" : null }
        : await desktopDeviceCanDownload({
            request,
            token,
            userId: user.id,
            productId: product.id,
            deviceId: requestDeviceId,
            tokenExpiresAt: new Date(tokenPayload.exp * 1000),
          });

      if (!isLauncher && hasAccess && !deviceGate.allowed) {
        await writeSecurityLog({
          request,
          userId: user.id,
          productSlug: product.slug,
          reason: `DESKTOP_PRODUCTS_${deviceGate.status}`,
        });
      }

      return {
        slug: product.slug,
        name: product.name,
        hasAccess,
        entitlementStatus: product.entitlementStatus,
        entitlementSource: product.entitlementSource,
        expiresAt: product.expiresAt,
        latestVersion: latest?.version ?? null,
        minimumVersion: latest?.minimumVersion ?? latest?.version ?? null,
        releaseNotes: latest?.releaseNotes ?? "",
        downloadUrl:
          hasAccess && deviceGate.allowed && latest
            ? signedDownloadUrl(request, {
                userId: user.id,
                productSlug: product.slug,
                version: latest.version,
                deviceId: requestDeviceId ?? "launcher-public",
              })
            : null,
        sha256: hasAccess ? latest?.sha256 ?? null : null,
        deviceStatus: deviceGate.status,
        releasedAt: latest?.createdAt.toISOString() ?? null,
      };
    })),
  });
}

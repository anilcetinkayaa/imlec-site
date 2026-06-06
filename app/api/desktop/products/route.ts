import { createHmac, timingSafeEqual } from "node:crypto";
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

function buildDownloadUrl(request: Request, filePath: string) {
  return filePath.startsWith("http")
    ? filePath
    : new URL(`/downloads/${filePath}`, request.url).toString();
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function signedDownloadUrl(request: Request, params: {
  userId: string;
  productSlug: string;
  version: string;
}) {
  const secret = process.env.DESKTOP_AUTH_SECRET;

  if (!secret) {
    return null;
  }

  const payload = {
    sub: params.userId,
    product: params.productSlug,
    version: params.version,
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
    products: products.map((product) => {
      const latest = latestByProductId.get(product.id);
      const isLauncher = product.slug === "launcher";
      const hasAccess = product.hasAccess || isLauncher;

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
          hasAccess && latest
            ? signedDownloadUrl(request, {
                userId: user.id,
                productSlug: product.slug,
                version: latest.version,
              }) ?? buildDownloadUrl(request, latest.filePath)
            : null,
        sha256: hasAccess ? latest?.sha256 ?? null : null,
        releasedAt: latest?.createdAt.toISOString() ?? null,
      };
    }),
  });
}

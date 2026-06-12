import { createHmac, timingSafeEqual } from "node:crypto";
import { FeatureSuggestionStatus } from "@prisma/client";
import { prisma } from "@/src/db/prisma";

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
  return scheme === "Bearer" && token ? token : null;
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

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function authenticateDesktopUser(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return { error: jsonError("MISSING_TOKEN", 401), userId: null };
  }

  const tokenPayload = verifyDesktopToken(token);

  if (!tokenPayload) {
    return { error: jsonError("INVALID_TOKEN", 401), userId: null };
  }

  const user = await prisma.user.findUnique({
    where: { id: tokenPayload.sub },
    select: { id: true, disabledAt: true },
  });

  if (!user || user.disabledAt) {
    return { error: jsonError("USER_NOT_FOUND", 404), userId: null };
  }

  return { error: null, userId: user.id };
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

const PUBLIC_STATUSES = [
  FeatureSuggestionStatus.APPROVED,
  FeatureSuggestionStatus.PLANNED,
  FeatureSuggestionStatus.IN_PROGRESS,
  FeatureSuggestionStatus.DONE,
];

export async function GET(request: Request) {
  const auth = await authenticateDesktopUser(request);

  if (auth.error) {
    return auth.error;
  }

  const url = new URL(request.url);
  const productSlug = cleanText(url.searchParams.get("productSlug"), 40).toLowerCase() || "fis260";
  const userId = auth.userId;

  const [published, mine] = await Promise.all([
    prisma.featureSuggestion.findMany({
      where: {
        productSlug,
        status: { in: PUBLIC_STATUSES },
      },
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        votes: {
          where: { userId },
          select: { value: true },
        },
      },
    }),
    prisma.featureSuggestion.findMany({
      where: {
        productSlug,
        userId,
        status: {
          in: [
            FeatureSuggestionStatus.PENDING,
            FeatureSuggestionStatus.REJECTED,
            FeatureSuggestionStatus.ARCHIVED,
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return Response.json({
    ok: true,
    published: published.map((suggestion) => ({
      id: suggestion.id,
      title: suggestion.title,
      description: suggestion.description,
      status: suggestion.status,
      score: suggestion.score,
      upvotes: suggestion.upvotes,
      downvotes: suggestion.downvotes,
      my_vote: suggestion.votes[0]?.value ?? 0,
      created_at: suggestion.createdAt.toISOString(),
      updated_at: suggestion.updatedAt.toISOString(),
    })),
    mine: mine.map((suggestion) => ({
      id: suggestion.id,
      title: suggestion.title,
      description: suggestion.description,
      status: suggestion.status,
      admin_note: suggestion.adminNote,
      created_at: suggestion.createdAt.toISOString(),
      updated_at: suggestion.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const auth = await authenticateDesktopUser(request);

  if (auth.error) {
    return auth.error;
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!body) {
    return jsonError("INVALID_BODY", 400);
  }

  const title = cleanText(body.title, 90);
  const description = cleanText(body.description, 600);
  const productSlug = cleanText(body.productSlug, 40).toLowerCase() || "fis260";
  const appVersion = cleanText(body.appVersion, 40);

  if (title.length < 4 || description.length < 20) {
    return jsonError("TITLE_OR_DESCRIPTION_TOO_SHORT", 400);
  }

  const suggestion = await prisma.featureSuggestion.create({
    data: {
      userId: auth.userId,
      productSlug,
      appVersion: appVersion || null,
      title,
      description,
    },
    select: {
      id: true,
      status: true,
    },
  });

  return Response.json({
    ok: true,
    suggestion_id: suggestion.id,
    status: suggestion.status,
  });
}

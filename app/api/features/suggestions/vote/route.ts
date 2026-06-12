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

const VOTABLE_STATUSES = new Set<FeatureSuggestionStatus>([
  FeatureSuggestionStatus.APPROVED,
  FeatureSuggestionStatus.PLANNED,
  FeatureSuggestionStatus.IN_PROGRESS,
]);

async function recalculateScore(suggestionId: string) {
  const votes = await prisma.featureSuggestionVote.findMany({
    where: { suggestionId },
    select: { value: true },
  });
  const upvotes = votes.filter((vote) => vote.value > 0).length;
  const downvotes = votes.filter((vote) => vote.value < 0).length;
  const score = upvotes - downvotes;

  return prisma.featureSuggestion.update({
    where: { id: suggestionId },
    data: { upvotes, downvotes, score },
    select: {
      id: true,
      score: true,
      upvotes: true,
      downvotes: true,
    },
  });
}

export async function POST(request: Request) {
  const auth = await authenticateDesktopUser(request);

  if (auth.error) {
    return auth.error;
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const suggestionId = String(body?.suggestionId ?? "").trim();
  const value = Number(body?.value);

  if (!suggestionId || ![1, -1].includes(value)) {
    return jsonError("INVALID_BODY", 400);
  }

  const suggestion = await prisma.featureSuggestion.findUnique({
    where: { id: suggestionId },
    select: { id: true, status: true },
  });

  if (!suggestion) {
    return jsonError("SUGGESTION_NOT_FOUND", 404);
  }

  if (!VOTABLE_STATUSES.has(suggestion.status)) {
    return jsonError("SUGGESTION_NOT_VOTABLE", 409);
  }

  await prisma.featureSuggestionVote.upsert({
    where: {
      suggestionId_userId: {
        suggestionId,
        userId: auth.userId,
      },
    },
    create: {
      suggestionId,
      userId: auth.userId,
      value,
    },
    update: {
      value,
    },
  });

  const updated = await recalculateScore(suggestionId);

  return Response.json({
    ok: true,
    suggestion_id: updated.id,
    score: updated.score,
    upvotes: updated.upvotes,
    downvotes: updated.downvotes,
    my_vote: value,
  });
}

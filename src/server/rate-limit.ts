import { createHash } from "node:crypto";
import { prisma } from "@/src/db/prisma";

type RateLimitOptions = {
  scope: string;
  identifier: string;
  limit: number;
  windowMs: number;
};

function keyHash(scope: string, identifier: string) {
  return createHash("sha256")
    .update(`${scope}|${identifier.trim().toLowerCase()}`)
    .digest("hex");
}

export function requestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function consumeRateLimit({
  scope,
  identifier,
  limit,
  windowMs,
}: RateLimitOptions) {
  const cutoff = new Date(Date.now() - windowMs);
  const hash = keyHash(scope, identifier);

  await prisma.rateLimitEvent.deleteMany({
    where: { scope, keyHash: hash, createdAt: { lt: cutoff } },
  });

  const [, count] = await prisma.$transaction([
    prisma.rateLimitEvent.create({ data: { scope, keyHash: hash } }),
    prisma.rateLimitEvent.count({
      where: { scope, keyHash: hash, createdAt: { gte: cutoff } },
    }),
  ]);

  return {
    allowed: count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil(windowMs / 1000)),
  };
}

export async function clearRateLimit(scope: string, identifier: string) {
  await prisma.rateLimitEvent.deleteMany({
    where: { scope, keyHash: keyHash(scope, identifier) },
  });
}

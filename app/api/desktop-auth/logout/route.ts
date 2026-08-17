import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/src/db/prisma";

export const runtime = "nodejs";

type DesktopTokenPayload = {
  sub: string;
  type: "desktop-access";
  exp: number;
};

function bearerToken(request: Request) {
  const [scheme, token] = (request.headers.get("authorization") ?? "").split(" ");
  return scheme === "Bearer" && token ? token : null;
}

function verifyToken(token: string): DesktopTokenPayload | null {
  const secret = process.env.DESKTOP_AUTH_SECRET;
  const parts = token.split(".");
  if (!secret || parts.length !== 3) return null;

  const [headerPart, payloadPart, signature] = parts;
  const expected = createHmac("sha256", secret)
    .update(`${headerPart}.${payloadPart}`)
    .digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadPart, "base64url").toString("utf8"),
    ) as Partial<DesktopTokenPayload>;
    if (
      typeof payload.sub !== "string" ||
      payload.type !== "desktop-access" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }
    return payload as DesktopTokenPayload;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const token = bearerToken(request);
  const payload = token ? verifyToken(token) : null;
  if (!token || !payload) {
    return Response.json({ ok: false, error: "INVALID_TOKEN" }, { status: 401 });
  }

  await prisma.session.updateMany({
    where: {
      userId: payload.sub,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  return Response.json({ ok: true });
}

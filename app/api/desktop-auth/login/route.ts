import { createHmac } from "node:crypto";
import { prisma } from "@/src/db/prisma";
import { normalizeEmail, verifyPassword } from "@/src/server/auth/password";

export const runtime = "nodejs";

function invalidCredentialsResponse() {
  return Response.json(
    {
      ok: false,
      error: "INVALID_CREDENTIALS",
    },
    {
      status: 401,
    },
  );
}

function serverMisconfiguredResponse() {
  return Response.json(
    {
      ok: false,
      error: "SERVER_MISCONFIGURED",
    },
    {
      status: 500,
    },
  );
}

function isLoginBody(value: unknown): value is {
  email: string;
  password: string;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "email" in value &&
    "password" in value &&
    typeof value.email === "string" &&
    typeof value.password === "string"
  );
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function signDesktopToken(user: { id: string; email: string; role: string }) {
  const secret = process.env.DESKTOP_AUTH_SECRET;

  if (!secret) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    type: "desktop-access",
    iat: now,
    exp: now + 7 * 24 * 60 * 60,
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", secret)
    .update(unsignedToken)
    .digest("base64url");

  return `${unsignedToken}.${signature}`;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return invalidCredentialsResponse();
  }

  if (!isLoginBody(body)) {
    return invalidCredentialsResponse();
  }

  const email = normalizeEmail(body.email);
  const password = body.password;

  if (!email || !password) {
    return invalidCredentialsResponse();
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      role: true,
      disabledAt: true,
    },
  });

  if (!user?.passwordHash || user.disabledAt) {
    return invalidCredentialsResponse();
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    return invalidCredentialsResponse();
  }

  const desktopToken = signDesktopToken(user);

  if (!desktopToken) {
    return serverMisconfiguredResponse();
  }

  return Response.json({
    ok: true,
    desktopToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}

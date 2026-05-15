import type { Prisma } from "@prisma/client";
import { getAdminSession } from "@/src/server/admin";

export async function requireAdminSession() {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    return {
      error: Response.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 },
      ),
    };
  }

  if (admin.status === "forbidden") {
    return {
      error: Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 }),
    };
  }

  return { session: admin.session };
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}

export function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

import { NextResponse } from "next/server";
import { prisma } from "@/src/db/prisma";
import { requireAdminApi } from "@/src/server/admin";

export const runtime = "nodejs";

function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

async function parseBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    return {
      shouldRedirect: false,
      id: typeof body.id === "string" ? body.id.trim() : "",
    };
  }

  const formData = await request.formData();
  return {
    shouldRedirect: true,
    id: String(formData.get("id") ?? "").trim(),
  };
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  const input = await parseBody(request);

  if (!input.id) {
    return jsonError("INVALID_BODY", 400);
  }

  const announcement = await prisma.announcement.findUnique({
    where: { id: input.id },
    select: { id: true },
  });

  if (!announcement) {
    return jsonError("ANNOUNCEMENT_NOT_FOUND", 404);
  }

  await prisma.announcement.delete({
    where: { id: input.id },
  });

  if (input.shouldRedirect) {
    return NextResponse.redirect(
      new URL("/admin/announcements", request.url),
      303,
    );
  }

  return Response.json({ ok: true });
}

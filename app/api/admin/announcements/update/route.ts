import { AnnouncementType } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/src/db/prisma";
import { requireAdminApi } from "@/src/server/admin";

export const runtime = "nodejs";

function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

function parseOptionalDate(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";

  if (!raw) {
    return null;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isAnnouncementType(value: string): value is AnnouncementType {
  return Object.values(AnnouncementType).includes(value as AnnouncementType);
}

async function parseBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    return {
      shouldRedirect: false,
      id: typeof body.id === "string" ? body.id.trim() : "",
      title: typeof body.title === "string" ? body.title.trim() : "",
      body: typeof body.body === "string" ? body.body.trim() : "",
      type: typeof body.type === "string" ? body.type.trim() : "",
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() : "",
      productSlug: typeof body.productSlug === "string" ? body.productSlug.trim().toLowerCase() : "launcher",
      isPublished: body.isPublished === true,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
    };
  }

  const formData = await request.formData();
  return {
    shouldRedirect: true,
    id: String(formData.get("id") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
    type: String(formData.get("type") ?? "").trim(),
    imageUrl: String(formData.get("imageUrl") ?? "").trim(),
    productSlug: String(formData.get("productSlug") ?? "launcher").trim().toLowerCase(),
    isPublished: formData.get("isPublished") === "on",
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  };
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi({ write: true });

  if (unauthorized) {
    return unauthorized;
  }

  const input = await parseBody(request);
  const startsAt = parseOptionalDate(input.startsAt);
  const endsAt = parseOptionalDate(input.endsAt);

  if (!input.id || !input.title || !input.body || !isAnnouncementType(input.type)) {
    return jsonError("INVALID_BODY", 400);
  }

  if (startsAt === undefined) {
    return jsonError("INVALID_STARTS_AT", 400);
  }

  if (endsAt === undefined) {
    return jsonError("INVALID_ENDS_AT", 400);
  }

  const announcement = await prisma.announcement.findUnique({
    where: { id: input.id },
    select: { id: true },
  });

  if (!announcement) {
    return jsonError("ANNOUNCEMENT_NOT_FOUND", 404);
  }

  await prisma.announcement.update({
    where: { id: input.id },
    data: {
      title: input.title,
      body: input.body,
      type: input.type,
      imageUrl: input.imageUrl || null,
      productSlug: input.productSlug || "launcher",
      isPublished: input.isPublished,
      startsAt,
      endsAt,
    },
  });

  if (input.shouldRedirect) {
    return NextResponse.redirect(
      new URL("/admin/announcements", request.url),
      303,
    );
  }

  return Response.json({ ok: true });
}

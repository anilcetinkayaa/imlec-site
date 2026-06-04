import { NextResponse } from "next/server";
import { prisma } from "@/src/db/prisma";
import {
  getClientIp,
  requireAdminSession,
  toJsonValue,
} from "@/src/server/admin-action-log";

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
      name: typeof body.name === "string" ? body.name.trim() : "",
      billingEmail:
        typeof body.billingEmail === "string"
          ? body.billingEmail.trim().toLowerCase()
          : "",
    };
  }

  const formData = await request.formData();
  return {
    shouldRedirect: true,
    name: String(formData.get("name") ?? "").trim(),
    billingEmail: String(formData.get("billingEmail") ?? "").trim().toLowerCase(),
  };
}

export async function POST(request: Request) {
  const admin = await requireAdminSession({ write: true });

  if (admin.error) {
    return admin.error;
  }

  const input = await parseBody(request);

  if (!input.name) {
    return jsonError("INVALID_BODY", 400);
  }

  const organization = await prisma.$transaction(async (tx) => {
    const created = await tx.organization.create({
      data: {
        name: input.name,
        billingEmail: input.billingEmail || null,
      },
    });

    await tx.adminActionLog.create({
      data: {
        adminId: admin.session.user.id,
        action: "ORGANIZATION_CREATE",
        before: toJsonValue(null),
        after: toJsonValue(created),
        ipAddress: getClientIp(request),
      },
    });

    return created;
  });

  if (input.shouldRedirect) {
    return NextResponse.redirect(new URL("/admin/organizations", request.url), 303);
  }

  return Response.json({ ok: true, organizationId: organization.id });
}

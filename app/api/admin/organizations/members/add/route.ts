import { MembershipRole } from "@prisma/client";
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

function isMembershipRole(value: string): value is MembershipRole {
  return Object.values(MembershipRole).includes(value as MembershipRole);
}

async function parseBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    return {
      shouldRedirect: false,
      organizationId:
        typeof body.organizationId === "string" ? body.organizationId.trim() : "",
      email: typeof body.email === "string" ? body.email.trim().toLowerCase() : "",
      role: typeof body.role === "string" ? body.role.trim() : "",
    };
  }

  const formData = await request.formData();
  return {
    shouldRedirect: true,
    organizationId: String(formData.get("organizationId") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    role: String(formData.get("role") ?? "").trim(),
  };
}

export async function POST(request: Request) {
  const admin = await requireAdminSession({ write: true });

  if (admin.error) {
    return admin.error;
  }

  const input = await parseBody(request);

  if (!input.organizationId || !input.email || !isMembershipRole(input.role)) {
    return jsonError("INVALID_BODY", 400);
  }

  const role = input.role;

  const [organization, user] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: input.organizationId },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, email: true },
    }),
  ]);

  if (!organization) {
    return jsonError("ORGANIZATION_NOT_FOUND", 404);
  }

  if (!user) {
    return jsonError("USER_NOT_FOUND", 404);
  }

  const membership = await prisma.$transaction(async (tx) => {
    const before = await tx.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id,
        },
      },
    });

    const after = await tx.membership.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id,
        },
      },
      update: {
        role,
        removedAt: null,
      },
      create: {
        userId: user.id,
        organizationId: organization.id,
        role,
        removedAt: null,
      },
    });

    await tx.adminActionLog.create({
      data: {
        adminId: admin.session.user.id,
        targetUserId: user.id,
        action: "ORGANIZATION_MEMBER_UPSERT",
        before: toJsonValue(before),
        after: toJsonValue(after),
        ipAddress: getClientIp(request),
      },
    });

    return after;
  });

  if (input.shouldRedirect) {
    return NextResponse.redirect(new URL("/admin/organizations", request.url), 303);
  }

  return Response.json({ ok: true, membershipId: membership.id });
}

import { EntitlementSource, EntitlementStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/src/db/prisma";
import {
  getClientIp,
  requireAdminSession,
  toJsonValue,
} from "@/src/server/admin-action-log";
import { upsertEntitlementBySource } from "@/src/server/entitlement-helpers";

export const runtime = "nodejs";

const CAMPAIGN_SOURCES: Record<string, EntitlementSource> = {
  TRIAL_7: EntitlementSource.TRIAL,
  RETENTION_14: EntitlementSource.MANUAL,
  RECOVERY_30: EntitlementSource.MANUAL,
};

function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function parseBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    return {
      shouldRedirect: false,
      email: typeof body.email === "string" ? body.email.trim().toLowerCase() : "",
      productId: typeof body.productId === "string" ? body.productId.trim() : "",
      campaignCode:
        typeof body.campaignCode === "string" ? body.campaignCode.trim() : "",
      days: Number(body.days),
      reason: typeof body.reason === "string" ? body.reason.trim() : "",
    };
  }

  const formData = await request.formData();
  return {
    shouldRedirect: true,
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    productId: String(formData.get("productId") ?? "").trim(),
    campaignCode: String(formData.get("campaignCode") ?? "").trim(),
    days: Number(formData.get("days") ?? 0),
    reason: String(formData.get("reason") ?? "").trim(),
  };
}

export async function POST(request: Request) {
  const admin = await requireAdminSession({ write: true });

  if (admin.error) {
    return admin.error;
  }

  const input = await parseBody(request);
  const source = CAMPAIGN_SOURCES[input.campaignCode];

  if (
    !input.email ||
    !input.productId ||
    !source ||
    !Number.isInteger(input.days) ||
    input.days < 1 ||
    input.days > 365
  ) {
    return jsonError("INVALID_BODY", 400);
  }

  const [user, product] = await Promise.all([
    prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, email: true },
    }),
    prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true, slug: true },
    }),
  ]);

  if (!user) {
    return jsonError("USER_NOT_FOUND", 404);
  }

  if (!product) {
    return jsonError("PRODUCT_NOT_FOUND", 404);
  }

  const entitlement = await prisma.$transaction(async (tx) => {
    const before = await tx.entitlement.findFirst({
      where: {
        userId: user.id,
        productId: product.id,
        source,
      },
      orderBy: { createdAt: "desc" },
    });
    const now = new Date();
    const base =
      before?.expiresAt && before.expiresAt > now ? before.expiresAt : now;
    const expiresAt = addDays(base, input.days);

    const after = await upsertEntitlementBySource(tx, {
      userId: user.id,
      productId: product.id,
      source,
      status: EntitlementStatus.ACTIVE,
      startsAt: now,
      expiresAt,
      revokedAt: null,
    });

    await tx.adminActionLog.create({
      data: {
        adminId: admin.session.user.id,
        targetUserId: user.id,
        action: "CAMPAIGN_GRANT",
        before: toJsonValue(before),
        after: toJsonValue({
          entitlement: after,
          campaignCode: input.campaignCode,
          days: input.days,
          reason: input.reason || null,
        }),
        ipAddress: getClientIp(request),
      },
    });

    return after;
  });

  if (input.shouldRedirect) {
    return NextResponse.redirect(new URL("/admin/campaigns", request.url), 303);
  }

  return Response.json({ ok: true, entitlementId: entitlement.id });
}

"use server";

import { EntitlementSource, EntitlementStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/src/db/prisma";
import {
  requireAdminSession,
  toJsonValue,
} from "@/src/server/admin-action-log";
import { upsertEntitlementBySource } from "@/src/server/entitlement-helpers";

const CAMPAIGN_SOURCES: Record<string, EntitlementSource> = {
  TRIAL_7: EntitlementSource.TRIAL,
  RETENTION_14: EntitlementSource.MANUAL,
  RECOVERY_30: EntitlementSource.MANUAL,
};

export type CampaignGrantState = {
  ok?: boolean;
  message?: string;
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function grantCampaign(
  _previousState: CampaignGrantState,
  formData: FormData,
): Promise<CampaignGrantState> {
  const admin = await requireAdminSession({ write: true });

  if (admin.error) {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const productId = String(formData.get("productId") ?? "").trim();
  const campaignCode = String(formData.get("campaignCode") ?? "").trim();
  const days = Number(formData.get("days") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();
  const source = CAMPAIGN_SOURCES[campaignCode];

  if (!email) {
    return { ok: false, message: "Kullanıcı e-postası zorunlu." };
  }

  if (!productId || !source) {
    return { ok: false, message: "Ürün ve kampanya tipi seçilmelidir." };
  }

  if (!Number.isInteger(days) || days < 1 || days > 365) {
    return { ok: false, message: "Gün 1 ile 365 arasında olmalı." };
  }

  const [user, product] = await Promise.all([
    prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    }),
    prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  if (!user) {
    return {
      ok: false,
      message: `"${email}" ile kayıtlı kullanıcı bulunamadı. Müşterinin önce siteye üye olması gerekir.`,
    };
  }

  if (!product) {
    return { ok: false, message: "Ürün bulunamadı." };
  }

  const expiresAt = await prisma.$transaction(async (tx) => {
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
    const nextExpiresAt = addDays(base, days);

    const after = await upsertEntitlementBySource(tx, {
      userId: user.id,
      productId: product.id,
      source,
      status: EntitlementStatus.ACTIVE,
      startsAt: now,
      expiresAt: nextExpiresAt,
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
          campaignCode,
          days,
          reason: reason || null,
        }),
      },
    });

    return nextExpiresAt;
  });

  revalidatePath("/admin/campaigns");
  revalidatePath("/admin");

  const formattedDate = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(expiresAt);

  return {
    ok: true,
    message: `${user.email} için ${product.name} erişimi tanımlandı. Bitiş: ${formattedDate} (${days} gün).`,
  };
}

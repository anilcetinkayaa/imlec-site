import { EntitlementSource, UserRole } from "@prisma/client";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/ui";
import { CampaignGrantForm, type CampaignPreset } from "./campaign-form";

export const metadata: Metadata = {
  title: "Kampanyalar | İmleç Admin",
  description: "Deneme, elde tutma ve telafi kampanyalarını yönetin.",
};

const campaignPresets: CampaignPreset[] = [
  {
    code: "TRIAL_7",
    title: "7 gün ücretsiz deneme",
    days: 7,
    description: "Yeni üyeye FİŞ260 deneme erişimi verir.",
  },
  {
    code: "RETENTION_14",
    title: "14 gün elde tutma",
    days: 14,
    description: "İptal etmek isteyen müşteriye karar süresi verir.",
  },
  {
    code: "RECOVERY_30",
    title: "30 gün telafi",
    days: 30,
    description: "Destek veya hizmet aksaması sonrası iyi niyet uzatmasıdır.",
  },
];

const sourceLabels: Record<string, string> = {
  TRIAL: "Deneme",
  MANUAL: "Manuel",
  ADMIN: "Admin",
  LEMON_SQUEEZY: "Satın alma",
};

function formatDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function monthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

type CampaignLogDetails = {
  campaignCode?: string;
  days?: number;
  reason?: string | null;
};

function parseLogDetails(value: unknown): CampaignLogDetails {
  if (!value || typeof value !== "object") {
    return {};
  }
  const record = value as Record<string, unknown>;
  return {
    campaignCode:
      typeof record.campaignCode === "string" ? record.campaignCode : undefined,
    days: typeof record.days === "number" ? record.days : undefined,
    reason: typeof record.reason === "string" ? record.reason : null,
  };
}

export default async function AdminCampaignsPage() {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/campaigns");
  }

  if (admin.status === "forbidden") {
    redirect("/admin");
  }

  const [
    products,
    recentEntitlements,
    recentCampaignLogs,
    customerEmailRows,
    monthlyCampaignLogs,
  ] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.entitlement.findMany({
      where: {
        source: { in: [EntitlementSource.TRIAL, EntitlementSource.MANUAL] },
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: {
        product: { select: { name: true, slug: true } },
        user: { select: { email: true, name: true } },
      },
    }),
    prisma.adminActionLog.findMany({
      where: { action: "CAMPAIGN_GRANT" },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        targetUserId: true,
        createdAt: true,
        after: true,
      },
    }),
    prisma.user.findMany({
      where: { role: UserRole.USER },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { email: true },
    }),
    prisma.adminActionLog.findMany({
      where: {
        action: "CAMPAIGN_GRANT",
        createdAt: { gte: monthStart() },
      },
      select: { after: true },
    }),
  ]);

  const targetIds = [
    ...new Set(
      recentCampaignLogs
        .map((log) => log.targetUserId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const targets = targetIds.length
    ? await prisma.user.findMany({
        where: { id: { in: targetIds } },
        select: { id: true, email: true, name: true },
      })
    : [];
  const targetMap = new Map(
    targets.map((target) => [target.id, target.name ?? target.email]),
  );

  const monthlyByCode = new Map<string, number>();
  for (const log of monthlyCampaignLogs) {
    const code = parseLogDetails(log.after).campaignCode ?? "OTHER";
    monthlyByCode.set(code, (monthlyByCode.get(code) ?? 0) + 1);
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <AdminPageHeader
          eyebrow="Müşteri kazanımı"
          tone="warning"
          title="Kampanyalar"
          lead="Deneme, iptal kurtarma ve telafi erişimlerini tek yerden tanımlayın. İşlemler entitlement olarak yazılır ve admin loguna düşer."
          actions={
            <div className="flex gap-2">
              {campaignPresets.map((preset) => (
                <div
                  key={preset.code}
                  className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-white/[0.025] px-3 py-2 text-center"
                >
                  <p className="text-lg font-semibold text-[var(--text-primary)]">
                    {monthlyByCode.get(preset.code) ?? 0}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
                    {preset.days}g / bu ay
                  </p>
                </div>
              ))}
            </div>
          }
        />

        <div className="mt-6">
          <CampaignGrantForm
            presets={campaignPresets}
            products={products}
            customerEmails={customerEmailRows.map((row) => row.email)}
          />
        </div>

        <AdminPanel
          className="mt-6"
          eyebrow="Aktif tanımlar"
          title="Deneme ve manuel erişimler"
        >
          <div className="mt-4 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
            <div className="grid min-w-[720px] grid-cols-[1.3fr_1fr_0.8fr_0.9fr_0.9fr] bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              <span>Kullanıcı</span>
              <span>Ürün</span>
              <span>Kaynak</span>
              <span>Bitiş</span>
              <span>Güncelleme</span>
            </div>
            {recentEntitlements.length > 0 ? (
              recentEntitlements.map((entitlement) => {
                const expired =
                  entitlement.expiresAt && entitlement.expiresAt < new Date();

                return (
                  <div
                    key={entitlement.id}
                    className="grid min-w-[720px] grid-cols-[1.3fr_1fr_0.8fr_0.9fr_0.9fr] items-center border-t border-[var(--border-subtle)] px-4 py-3 text-sm text-[var(--text-secondary)]"
                  >
                    <span className="truncate text-[var(--text-primary)]">
                      {entitlement.user.email}
                    </span>
                    <span>{entitlement.product.name}</span>
                    <span>
                      {sourceLabels[entitlement.source] ?? entitlement.source}
                    </span>
                    <span
                      className={`font-mono text-xs ${
                        expired ? "text-[var(--danger)]" : ""
                      }`}
                    >
                      {formatDate(entitlement.expiresAt)}
                    </span>
                    <span className="font-mono text-xs">
                      {formatDate(entitlement.updatedAt)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="border-t border-[var(--border-subtle)] p-4">
                <AdminEmptyState>
                  Henüz deneme veya manuel kampanya yok.
                </AdminEmptyState>
              </div>
            )}
          </div>
        </AdminPanel>

        <AdminPanel
          className="mt-6"
          eyebrow="Denetim"
          title="Son kampanya logları"
        >
          <div className="mt-4 grid gap-3">
            {recentCampaignLogs.length > 0 ? (
              recentCampaignLogs.map((log) => {
                const details = parseLogDetails(log.after);
                const preset = campaignPresets.find(
                  (item) => item.code === details.campaignCode,
                );

                return (
                  <div
                    key={log.id}
                    className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-0)]/60 px-4 py-3 text-sm text-[var(--text-secondary)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-mono text-xs text-[var(--warning)]">
                        {preset?.title ?? details.campaignCode ?? "Kampanya"}
                        {details.days ? ` • ${details.days} gün` : ""}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-xs text-[var(--text-tertiary)]">
                      Hedef:{" "}
                      <span className="text-[var(--text-secondary)]">
                        {log.targetUserId
                          ? targetMap.get(log.targetUserId) ?? log.targetUserId
                          : "-"}
                      </span>
                      {details.reason ? ` — ${details.reason}` : ""}
                    </p>
                  </div>
                );
              })
            ) : (
              <AdminEmptyState>Kampanya logu yok.</AdminEmptyState>
            )}
          </div>
        </AdminPanel>
      </div>
    </main>
  );
}

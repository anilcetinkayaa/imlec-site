"use client";

import {
  Activity,
  Boxes,
  Bug,
  Download,
  Laptop,
  NotebookPen,
  Settings2,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/Tabs";
import {
  getAdminActionChanges,
  getAdminActionPresentation,
} from "@/src/server/admin-action-presenter";
import { AdminUserActions } from "./admin-user-actions";

type ProductOption = {
  id: string;
  name: string;
  slug: string;
};

type EntitlementItem = {
  id: string;
  productName: string;
  productSlug: string;
  status: string;
  source: string;
  startsAt: string;
  expiresAt: string;
  revokedAt: string;
  subscriptionStatus: string | null;
  renewsAt: string;
  subscriptionEndsAt: string;
  trialEndsAt: string;
};

type DeviceItem = {
  id: string;
  productName: string;
  deviceName: string;
  os: string;
  appVersion: string;
  status: string;
  lastSeenAt: string;
  revokedAt: string;
};

type DownloadLogItem = {
  id: string;
  success: boolean;
  reason: string;
  createdAt: string;
};

type ActionLogItem = {
  id: string;
  action: string;
  adminId: string;
  adminName: string;
  ipAddress: string;
  createdAt: string;
  before: unknown;
  after: unknown;
};

type UserNoteItem = {
  id: string;
  adminId: string;
  body: string;
  createdAt: string;
};

type AdminUserDetailTabsProps = {
  userId: string;
  products: ProductOption[];
  entitlements: EntitlementItem[];
  devices: DeviceItem[];
  downloadLogs: DownloadLogItem[];
  actionLogs: ActionLogItem[];
  notes: UserNoteItem[];
  diagnostic: {
    productExists: boolean;
    latestReason: string;
    endpoint: string;
  };
};

const statusColors: Record<string, string> = {
  ACTIVE: "#10b981",
  TRIAL: "#3b82f6",
  GRACE_PERIOD: "#3b82f6",
  INACTIVE: "#6b7280",
  EXPIRED: "#6b7280",
  REVOKED: "#ef4444",
  INTERNAL: "#8b5cf6",
  MANUAL: "#8b5cf6",
  ADMIN: "#8b5cf6",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Aktif",
  TRIAL: "Deneme",
  GRACE_PERIOD: "Ödeme bekleniyor",
  INACTIVE: "Pasif",
  EXPIRED: "Süresi doldu",
  REVOKED: "Kaldırıldı",
  INTERNAL: "Sistem",
  MANUAL: "Manuel",
  ADMIN: "Yönetici",
  LEMON_SQUEEZY: "Lemon Squeezy",
};

function StatusBadge({ value }: { value: string }) {
  const color = statusColors[value] ?? "#6b7280";

  return (
    <span
      className="inline-flex w-fit rounded-md border px-2 py-1 font-mono text-[11px] uppercase tracking-[0.08em]"
      style={{
        borderColor: `${color}55`,
        backgroundColor: `${color}1f`,
        color,
      }}
    >
      {statusLabels[value] ?? value}
    </span>
  );
}

function entitlementDateLabel(item: EntitlementItem) {
  if (item.revokedAt !== "-") {
    return `Kaldırıldı: ${item.revokedAt}`;
  }

  if (item.source === "LEMON_SQUEEZY") {
    if (item.subscriptionStatus === "CANCELED") {
      return item.subscriptionEndsAt === "-"
        ? "Yenileme kapalı"
        : `Erişim bitişi: ${item.subscriptionEndsAt}`;
    }

    if (item.subscriptionStatus === "TRIALING") {
      return item.trialEndsAt === "-"
        ? "Deneme tarihi eşitleniyor"
        : `Deneme bitişi: ${item.trialEndsAt}`;
    }

    return item.renewsAt === "-"
      ? "Yenileme tarihi eşitleniyor"
      : `Sonraki yenileme: ${item.renewsAt}`;
  }

  return item.expiresAt === "-" ? "Süresiz" : item.expiresAt;
}

function TechnicalRecord({
  before,
  after,
}: {
  before: unknown;
  after: unknown;
}) {
  return (
    <details className="mt-3 rounded-lg border border-white/[0.07] bg-black/20 p-3">
      <summary className="cursor-pointer text-xs text-zinc-400">
        Teknik kaydı göster
      </summary>
      <div className="mt-3 grid gap-3">
        {[
          ["Önceki kayıt", before],
          ["Sonraki kayıt", after],
        ].map(([label, value]) => (
          <div key={label as string}>
            <p className="mb-1 text-xs text-zinc-500">{label as string}</p>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-black/30 p-3 font-mono text-[11px] leading-5 text-zinc-400">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </details>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-[#0c0d10] px-4 py-3 text-sm text-zinc-500">
      {children}
    </div>
  );
}

function AdminActionTimeline({ logs }: { logs: ActionLogItem[] }) {
  if (logs.length === 0) {
    return <EmptyState>Henüz admin işlem kaydı yok.</EmptyState>;
  }

  return (
    <div className="grid gap-3">
      {logs.map((log) => {
        const presentation = getAdminActionPresentation(log.action);
        const changes = getAdminActionChanges(log.before, log.after);

        return (
          <article
            key={log.id}
            className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-violet-400/25 bg-violet-400/10 px-2 py-1 font-mono text-[10px] text-violet-300">
                    {presentation.category}
                  </span>
                  <h3 className="text-sm font-semibold text-white">
                    {presentation.label}
                  </h3>
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  İşlemi yapan:{" "}
                  <span className="font-medium text-zinc-200">
                    {log.adminName}
                  </span>
                </p>
              </div>
              <time className="shrink-0 font-mono text-xs text-zinc-500">
                {log.createdAt}
              </time>
            </div>

            {changes.length > 0 ? (
              <div className="mt-4 overflow-x-auto rounded-lg border border-white/[0.07]">
                <div className="grid min-w-[520px] grid-cols-[0.8fr_1fr_1fr] bg-white/[0.03] px-3 py-2 text-[11px] text-zinc-500">
                  <span>Alan</span>
                  <span>Önce</span>
                  <span>Sonra</span>
                </div>
                {changes.map((change) => (
                  <div
                    key={change.key}
                    className="grid min-w-[520px] grid-cols-[0.8fr_1fr_1fr] gap-2 border-t border-white/[0.07] px-3 py-2 text-xs"
                  >
                    <span className="text-zinc-400">{change.label}</span>
                    <span className="break-words text-zinc-500">
                      {change.before}
                    </span>
                    <span className="break-words text-zinc-200">
                      {change.after}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-zinc-500">
                Bu işlem için alan bazlı değişiklik özeti bulunmuyor.
              </p>
            )}

            <TechnicalRecord before={log.before} after={log.after} />
          </article>
        );
      })}
    </div>
  );
}

export function AdminUserDetailTabs({
  userId,
  products,
  entitlements,
  devices,
  downloadLogs,
  actionLogs,
  notes,
  diagnostic,
}: AdminUserDetailTabsProps) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#101216] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:p-4">
      <Tabs defaultValue="overview">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-4 xl:grid-cols-8">
          <TabsTrigger value="overview" className="justify-start gap-2">
            <Activity className="size-4" strokeWidth={1.5} />
            Özet
          </TabsTrigger>
          <TabsTrigger value="entitlements" className="justify-start gap-2">
            <Boxes className="size-4" strokeWidth={1.5} />
            Ürün erişimleri
          </TabsTrigger>
          <TabsTrigger value="devices" className="justify-start gap-2">
            <Laptop className="size-4" strokeWidth={1.5} />
            Cihazlar
          </TabsTrigger>
          <TabsTrigger value="downloads" className="justify-start gap-2">
            <Download className="size-4" strokeWidth={1.5} />
            İndirmeler
          </TabsTrigger>
          <TabsTrigger value="notes" className="justify-start gap-2">
            <NotebookPen className="size-4" strokeWidth={1.5} />
            Notlar
          </TabsTrigger>
          <TabsTrigger value="history" className="justify-start gap-2">
            <Activity className="size-4" strokeWidth={1.5} />
            İşlem geçmişi
          </TabsTrigger>
          <TabsTrigger value="actions" className="justify-start gap-2">
            <Settings2 className="size-4" strokeWidth={1.5} />
            Yönetim
          </TabsTrigger>
          <TabsTrigger value="diagnostic" className="justify-start gap-2">
            <Bug className="size-4" strokeWidth={1.5} />
            Teknik kontrol
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-2">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
              <p className="text-sm font-medium text-white">Hesap durumu</p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
                Bu görünüm müşterinin ürün erişimini, cihaz bağlantısını ve
                son yönetim hareketlerini tek bakışta özetler.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Toplam erişim", entitlements.length],
                  ["Kayıtlı cihaz", devices.length],
                  ["İndirme kaydı", downloadLogs.length],
                  ["Yönetim işlemi", actionLogs.length],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-lg border border-white/[0.07] bg-black/15 p-3"
                  >
                    <p className="text-xs text-zinc-500">{label}</p>
                    <p className="mt-2 font-mono text-2xl text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
              <p className="text-sm font-medium text-white">Son durumlar</p>
              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-3">
                  <span className="text-sm text-zinc-400">Son indirme</span>
                  <span className="text-right text-sm text-zinc-200">
                    {downloadLogs[0]
                      ? `${downloadLogs[0].success ? "Başarılı" : "Başarısız"} · ${downloadLogs[0].createdAt}`
                      : "Kayıt yok"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-3">
                  <span className="text-sm text-zinc-400">Son cihaz</span>
                  <span className="text-right text-sm text-zinc-200">
                    {devices[0]
                      ? `${devices[0].deviceName} · ${devices[0].lastSeenAt}`
                      : "Kayıt yok"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-zinc-400">Son yönetim işlemi</span>
                  <span className="text-right text-sm text-zinc-200">
                    {actionLogs[0]
                      ? `${getAdminActionPresentation(actionLogs[0].action).label} · ${actionLogs[0].createdAt}`
                      : "Kayıt yok"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 lg:col-span-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-medium text-white">Ürün erişimleri</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Hesaba tanımlanmış aktif, süresi dolmuş ve kaldırılmış tüm
                    ürün kayıtları.
                  </p>
                </div>
                <span className="font-mono text-xs text-zinc-500">
                  {entitlements.length} kayıt
                </span>
              </div>

              {entitlements.length > 0 ? (
                <div className="mt-4 overflow-x-auto rounded-lg border border-white/[0.07]">
                  <div className="grid min-w-[780px] grid-cols-[1.2fr_0.8fr_0.8fr_1fr_1fr] bg-white/[0.03] px-4 py-3 text-xs text-zinc-500">
                    <span>Ürün</span>
                    <span>Durum</span>
                    <span>Kaynak</span>
                    <span>Başlangıç</span>
                    <span>Bitiş / kaldırılma</span>
                  </div>
                  {entitlements.map((item) => (
                    <div
                      key={item.id}
                      className="grid min-w-[780px] grid-cols-[1.2fr_0.8fr_0.8fr_1fr_1fr] items-center border-t border-white/[0.07] px-4 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-200">
                          {item.productName}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-zinc-500">
                          {item.productSlug}
                        </p>
                      </div>
                      <StatusBadge value={item.status} />
                      <StatusBadge value={item.source} />
                      <span className="font-mono text-xs text-zinc-400">
                        {item.startsAt}
                      </span>
                      <span className="font-mono text-xs text-zinc-400">
                        {entitlementDateLabel(item)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState>Hesaba tanımlanmış ürün erişimi yok.</EmptyState>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 lg:col-span-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-medium text-white">Kayıtlı cihazlar</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Masaüstü uygulamasına bağlanmış cihazlar ve son bağlantı
                    bilgileri.
                  </p>
                </div>
                <span className="font-mono text-xs text-zinc-500">
                  {devices.length} cihaz
                </span>
              </div>

              {devices.length > 0 ? (
                <div className="mt-4 overflow-x-auto rounded-lg border border-white/[0.07]">
                  <div className="grid min-w-[820px] grid-cols-[1.2fr_1fr_0.8fr_0.7fr_0.8fr_1fr] bg-white/[0.03] px-4 py-3 text-xs text-zinc-500">
                    <span>Cihaz</span>
                    <span>Ürün</span>
                    <span>Sistem</span>
                    <span>Sürüm</span>
                    <span>Durum</span>
                    <span>Son bağlantı</span>
                  </div>
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="grid min-w-[820px] grid-cols-[1.2fr_1fr_0.8fr_0.7fr_0.8fr_1fr] items-center border-t border-white/[0.07] px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-zinc-200">
                          {device.deviceName}
                        </p>
                        {device.revokedAt !== "-" ? (
                          <p className="mt-1 font-mono text-[11px] text-red-300">
                            Kaldırıldı: {device.revokedAt}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-zinc-400">
                        {device.productName}
                      </span>
                      <span className="text-zinc-400">{device.os}</span>
                      <span className="font-mono text-xs text-zinc-400">
                        {device.appVersion}
                      </span>
                      <StatusBadge value={device.status} />
                      <span className="font-mono text-xs text-zinc-400">
                        {device.lastSeenAt}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState>Bu hesaba bağlı cihaz bulunmuyor.</EmptyState>
                </div>
              )}
            </div>

            <details className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 lg:col-span-2">
              <summary className="cursor-pointer text-xs text-zinc-500">
                Teknik hesap kimliğini göster
              </summary>
              <p className="mt-3 break-all font-mono text-xs text-zinc-300">
                {userId}
              </p>
            </details>
          </div>
        </TabsContent>

        <TabsContent value="entitlements" className="pt-2">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {entitlements.length > 0 ? (
              entitlements.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{item.productName}</p>
                      <p className="mt-1 font-mono text-xs text-zinc-500">
                        {item.productSlug}
                      </p>
                    </div>
                    <StatusBadge value={item.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge value={item.source} />
                    <span className="font-mono text-xs text-zinc-500">
                      {item.startsAt} → {entitlementDateLabel(item)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState>Erişim kaydı yok.</EmptyState>
            )}
          </div>
        </TabsContent>

        <TabsContent value="devices" className="pt-2">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {devices.length > 0 ? (
              devices.map((device) => (
                <div
                  key={device.id}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{device.deviceName}</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {device.productName} · {device.os} · {device.appVersion}
                      </p>
                    </div>
                    <StatusBadge value={device.status} />
                  </div>
                  <p className="mt-3 font-mono text-xs text-zinc-500">
                    Son aktif: {device.lastSeenAt}
                    {device.revokedAt !== "-"
                      ? ` · Kaldırılma: ${device.revokedAt}`
                      : ""}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState>Kayıtlı cihaz yok.</EmptyState>
            )}
          </div>
        </TabsContent>

        <TabsContent value="downloads" className="pt-2">
          <div className="grid gap-2">
            {downloadLogs.length > 0 ? (
              downloadLogs.map((log) => (
                <div
                  key={log.id}
                  className="grid gap-2 rounded-lg border border-white/[0.07] bg-[#0c0d10] px-4 py-3 text-sm sm:grid-cols-[0.7fr_1.4fr_0.8fr] sm:items-center"
                >
                  <span className={log.success ? "text-emerald-300" : "text-red-300"}>
                    {log.success ? "Başarılı" : "Başarısız"}
                  </span>
                  <span className="truncate text-zinc-400">{log.reason}</span>
                  <span className="font-mono text-xs text-zinc-500 sm:text-right">
                    {log.createdAt}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState>Henüz download log yok.</EmptyState>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="pt-2">
          <div className="grid gap-3 md:grid-cols-2">
            {notes.length > 0 ? (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"
                >
                  <p className="text-sm leading-6 text-zinc-300">{note.body}</p>
                  <p className="mt-3 font-mono text-xs text-zinc-500">
                    Yönetici kaydı · {note.createdAt}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState>Henüz not yok.</EmptyState>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="pt-2">
          <div className="mb-3">
            <h2 className="text-sm font-medium text-white">İşlem geçmişi</h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Bu müşteri hesabında yönetici veya personel tarafından yapılan
              değişiklikler.
            </p>
          </div>
          <AdminActionTimeline logs={actionLogs} />
        </TabsContent>

        <TabsContent value="actions" className="pt-2">
          <AdminUserActions
            userId={userId}
            products={products}
            entitlements={entitlements.map((item) => ({
              id: item.id,
              productName: item.productName,
              status: item.status,
            }))}
            devices={devices.map((device) => ({
              id: device.id,
              productName: device.productName,
              deviceName: device.deviceName === "-" ? null : device.deviceName,
              status: device.status,
            }))}
          />
        </TabsContent>

        <TabsContent value="diagnostic" className="pt-2">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-white/[0.07] bg-[#0c0d10] p-3">
              <p className="text-zinc-500">Tanılama adresi</p>
              <code className="mt-1 block break-all font-mono text-xs text-zinc-200">
                {diagnostic.endpoint}
              </code>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/[0.07] bg-[#0c0d10] p-3">
                <p className="text-zinc-500">Ürün</p>
                <p className="mt-1 text-white">
                  {diagnostic.productExists ? "FİŞ260 mevcut" : "FİŞ260 bulunamadı"}
                </p>
              </div>
              <div className="rounded-lg border border-white/[0.07] bg-[#0c0d10] p-3">
                <p className="text-zinc-500">Son log</p>
                <p className="mt-1 text-white">{diagnostic.latestReason}</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}

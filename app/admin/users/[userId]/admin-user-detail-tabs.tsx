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
    <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-auto rounded-2xl border border-white/[0.08] bg-[#101216] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
      <Tabs defaultValue="overview">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1">
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

        <TabsContent value="overview">
          <div className="grid gap-3">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
              <p className="text-sm font-medium text-white">Hesap özeti</p>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                Ürün erişimi, cihaz ve indirme durumunu bu alandan takip
                edebilirsiniz.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                <p className="text-xs text-zinc-500">Ürün erişimi</p>
                <p className="mt-2 font-mono text-2xl text-white">
                  {entitlements.length}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                <p className="text-xs text-zinc-500">Cihaz</p>
                <p className="mt-2 font-mono text-2xl text-white">
                  {devices.length}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                <p className="text-xs text-zinc-500">İndirme</p>
                <p className="mt-2 font-mono text-2xl text-white">
                  {downloadLogs.length}
                </p>
              </div>
            </div>
            <details className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
              <summary className="cursor-pointer text-xs text-zinc-500">
                Teknik hesap kimliğini göster
              </summary>
              <p className="mt-3 break-all font-mono text-xs text-zinc-300">
                {userId}
              </p>
            </details>
          </div>
        </TabsContent>

        <TabsContent value="entitlements">
          <div className="grid gap-3">
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
                      {item.startsAt} → {item.expiresAt}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState>Erişim kaydı yok.</EmptyState>
            )}
          </div>
        </TabsContent>

        <TabsContent value="devices">
          <div className="grid gap-3">
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

        <TabsContent value="downloads">
          <div className="grid gap-2">
            {downloadLogs.length > 0 ? (
              downloadLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.07] bg-[#0c0d10] px-3 py-2 font-mono text-xs"
                >
                  <span className={log.success ? "text-emerald-300" : "text-red-300"}>
                    {log.success ? "Başarılı" : "Başarısız"}
                  </span>
                  <span className="truncate text-zinc-400">{log.reason}</span>
                  <span className="text-zinc-500">{log.createdAt}</span>
                </div>
              ))
            ) : (
              <EmptyState>Henüz download log yok.</EmptyState>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <div className="grid gap-3">
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

        <TabsContent value="history">
          <div className="mb-3">
            <h2 className="text-sm font-medium text-white">İşlem geçmişi</h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Bu müşteri hesabında yönetici veya personel tarafından yapılan
              değişiklikler.
            </p>
          </div>
          <AdminActionTimeline logs={actionLogs} />
        </TabsContent>

        <TabsContent value="actions">
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

        <TabsContent value="diagnostic">
          <div className="grid gap-3">
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
    </div>
  );
}

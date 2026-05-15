"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/Tabs";
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
      {value}
    </span>
  );
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <details className="rounded-lg border border-white/[0.07] bg-[#0c0d10] p-3">
      <summary className="cursor-pointer text-sm text-zinc-300">{label}</summary>
      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded bg-black/30 p-3 font-mono text-[11px] leading-5 text-zinc-400">
        {JSON.stringify(value, null, 2)}
      </pre>
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
    <div className="relative grid gap-4">
      <div className="absolute bottom-3 left-[7px] top-3 w-px bg-white/[0.08]" />
      {logs.map((log) => (
        <article key={log.id} className="relative pl-7">
          <span className="absolute left-0 top-1.5 size-3 rounded-full bg-[#8b5cf6] shadow-[0_0_0_4px_rgba(139,92,246,0.12)]" />
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <StatusBadge value="INTERNAL" />
                <h3 className="mt-3 text-sm font-semibold text-white">
                  {log.action}
                </h3>
              </div>
              <span className="font-mono text-xs text-zinc-500">
                {log.createdAt}
              </span>
            </div>
            <p className="mt-3 font-mono text-xs text-zinc-500">
              admin={log.adminId} · ip={log.ipAddress}
            </p>
            <div className="mt-3 grid gap-2">
              <JsonBlock label="Before snapshot" value={log.before} />
              <JsonBlock label="After snapshot" value={log.after} />
            </div>
          </div>
        </article>
      ))}
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
    <aside className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-auto rounded-2xl border border-white/[0.08] bg-[#101216] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
      <Tabs defaultValue="overview">
        <TabsList className="w-full flex-wrap">
          {[
            ["overview", "Overview"],
            ["entitlements", "Entitlements"],
            ["devices", "Devices"],
            ["downloads", "DownloadLog"],
            ["notes", "Notes"],
            ["actions", "Actions"],
            ["diagnostic", "Diagnostic"],
          ].map(([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-3">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
                User
              </p>
              <p className="mt-2 break-all font-mono text-xs text-zinc-300">
                {userId}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                <p className="text-xs text-zinc-500">Entitlements</p>
                <p className="mt-2 font-mono text-2xl text-white">
                  {entitlements.length}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                <p className="text-xs text-zinc-500">Devices</p>
                <p className="mt-2 font-mono text-2xl text-white">
                  {devices.length}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                <p className="text-xs text-zinc-500">Logs</p>
                <p className="mt-2 font-mono text-2xl text-white">
                  {downloadLogs.length}
                </p>
              </div>
            </div>
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
                    Son aktif: {device.lastSeenAt} · Revoked: {device.revokedAt}
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
                    {log.success ? "success" : "failed"}
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
                    admin={note.adminId} · {note.createdAt}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState>Henüz not yok.</EmptyState>
            )}
          </div>
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
              <p className="text-zinc-500">API endpoint</p>
              <code className="mt-1 block break-all font-mono text-xs text-zinc-200">
                {diagnostic.endpoint}
              </code>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/[0.07] bg-[#0c0d10] p-3">
                <p className="text-zinc-500">Ürün</p>
                <p className="mt-1 text-white">
                  {diagnostic.productExists ? "fis260 mevcut" : "fis260 yok"}
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

      <div className="mt-4 border-t border-white/[0.08] pt-4">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
          Admin timeline
        </p>
        <AdminActionTimeline logs={actionLogs} />
      </div>
    </aside>
  );
}

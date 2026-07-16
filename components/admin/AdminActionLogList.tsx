import {
  getAdminActionChanges,
  getAdminActionPresentation,
} from "@/src/server/admin-action-presenter";

type ActionLog = {
  id: string;
  adminId: string;
  targetUserId: string | null;
  action: string;
  before: unknown;
  after: unknown;
  ipAddress: string | null;
  createdAt: Date;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function AdminActionLogList({
  logs,
  people,
}: {
  logs: ActionLog[];
  people: Map<string, string>;
}) {
  if (logs.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-0)]/60 px-4 py-5 text-sm text-[var(--text-tertiary)]">
        Seçilen filtrelerle eşleşen işlem bulunamadı.
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {logs.map((log) => {
        const presentation = getAdminActionPresentation(log.action);
        const changes = getAdminActionChanges(log.before, log.after);
        const actor = people.get(log.adminId) ?? "Bilinmeyen personel";
        const target = log.targetUserId
          ? people.get(log.targetUserId) ?? "Kullanıcı hesabı"
          : "Sistem";

        return (
          <article
            key={log.id}
            className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-0)]/60 px-4 py-3"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-[var(--radius-sm)] border border-[var(--accent-brand)]/25 bg-[var(--accent-brand)]/10 px-2 py-1 font-mono text-[10px] text-[var(--accent-brand)]">
                    {presentation.category}
                  </span>
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">
                    {presentation.label}
                  </h3>
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">
                    {actor}
                  </span>
                  {" · "}
                  Hedef: {target}
                </p>
              </div>
              <time className="shrink-0 font-mono text-xs text-[var(--text-tertiary)]">
                {formatDate(log.createdAt)}
              </time>
            </div>

            <details className="mt-3 border-t border-[var(--border-subtle)] pt-3">
              <summary className="cursor-pointer text-xs font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">
                Değişiklik ayrıntılarını göster
              </summary>
              {changes.length > 0 ? (
                <div className="mt-3 overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--border-subtle)]">
                  <div className="grid min-w-[560px] grid-cols-[0.8fr_1fr_1fr] bg-white/[0.03] px-3 py-2 text-xs text-[var(--text-tertiary)]">
                    <span>Alan</span>
                    <span>Önce</span>
                    <span>Sonra</span>
                  </div>
                  {changes.map((change) => (
                    <div
                      key={change.key}
                      className="grid min-w-[560px] grid-cols-[0.8fr_1fr_1fr] border-t border-[var(--border-subtle)] px-3 py-2 text-xs"
                    >
                      <span className="text-[var(--text-secondary)]">
                        {change.label}
                      </span>
                      <span className="break-words text-[var(--text-tertiary)]">
                        {change.before}
                      </span>
                      <span className="break-words text-[var(--text-primary)]">
                        {change.after}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                  Bu işlem için alan bazlı değişiklik özeti bulunmuyor.
                </p>
              )}
              {log.ipAddress ? (
                <p className="mt-3 font-mono text-[10px] text-[var(--text-tertiary)]">
                  IP: {log.ipAddress}
                </p>
              ) : null}
            </details>
          </article>
        );
      })}
    </div>
  );
}

import type * as React from "react";
import { cn } from "@/lib/cn";

type Tone = "brand" | "success" | "warning" | "danger" | "purple" | "neutral";

const toneText: Record<Tone, string> = {
  brand: "text-[var(--accent-brand)]",
  success: "text-[var(--success)]",
  warning: "text-[var(--warning)]",
  danger: "text-[var(--danger)]",
  purple: "text-[var(--accent-cozver)]",
  neutral: "text-[var(--text-tertiary)]",
};

const toneBox: Record<Tone, string> = {
  brand: "border-[var(--accent-brand)]/20 bg-[var(--accent-brand)]/[0.06]",
  success: "border-[var(--success)]/20 bg-[var(--success)]/[0.06]",
  warning: "border-[var(--warning)]/20 bg-[var(--warning)]/[0.06]",
  danger: "border-[var(--danger)]/20 bg-[var(--danger)]/[0.06]",
  purple: "border-[var(--accent-cozver)]/20 bg-[var(--accent-cozver)]/[0.06]",
  neutral: "border-[var(--border-subtle)] bg-white/[0.025]",
};

export function AdminPageHeader({
  eyebrow,
  title,
  lead,
  tone = "brand",
  actions,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  tone?: Tone;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className={cn("font-mono text-xs uppercase tracking-[0.24em]", toneText[tone])}>
          {eyebrow}
        </p>
        <h1 className="text-h2 mt-3 text-[var(--text-primary)]">{title}</h1>
        {lead ? (
          <p className="text-body-s mt-2 max-w-3xl text-[var(--text-secondary)]">
            {lead}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminPanel({
  id,
  eyebrow,
  title,
  actions,
  tone,
  className,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  actions?: React.ReactNode;
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-[var(--radius-lg)] border p-5",
        tone ? toneBox[tone] : "border-[var(--border-subtle)] bg-[var(--surface-1)]/60",
        className,
      )}
    >
      {eyebrow || title || actions ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {eyebrow ? (
              <p
                className={cn(
                  "font-mono text-xs uppercase tracking-[0.18em]",
                  tone ? toneText[tone] : "text-[var(--text-tertiary)]",
                )}
              >
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="text-h3 mt-2 text-[var(--text-primary)]">{title}</h2>
            ) : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function AdminStatCard({
  title,
  value,
  note,
  tone = "brand",
}: {
  title: string;
  value: string | number;
  note?: string;
  tone?: Tone;
}) {
  return (
    <div className={cn("rounded-[var(--radius-lg)] border p-5", toneBox[tone])}>
      <p className="text-sm text-[var(--text-secondary)]">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
        {value}
      </p>
      {note ? (
        <p className="mt-2 text-xs leading-5 text-[var(--text-tertiary)]">{note}</p>
      ) : null}
    </div>
  );
}

export function AdminEmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-2)]/50 px-4 py-5 text-sm text-[var(--text-tertiary)]">
      {children}
    </div>
  );
}

export function adminInputClass(extra?: string) {
  return cn(
    "h-11 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-0)]/70 px-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-brand)]/60",
    extra,
  );
}

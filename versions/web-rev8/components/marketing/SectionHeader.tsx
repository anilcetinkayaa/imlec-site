import type * as React from "react";
import { cn } from "@/lib/cn";

type SectionHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
};

export function SectionHeader({
  eyebrow,
  title,
  lead,
  align = "left",
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      data-slot="section-header"
      className={cn(
        "grid gap-4",
        align === "center" && "mx-auto max-w-3xl text-center",
        className,
      )}
      {...props}
    >
      {eyebrow ? (
        <p className="text-label font-mono text-[var(--accent-brand)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-h2 text-[var(--text-primary)]">{title}</h2>
      {lead ? (
        <p className="text-body max-w-2xl text-[var(--text-secondary)]">
          {lead}
        </p>
      ) : null}
    </div>
  );
}

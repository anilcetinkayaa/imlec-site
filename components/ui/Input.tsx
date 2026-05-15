import type * as React from "react";
import { cn } from "@/lib/cn";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        "flex h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-[inset_0_1px_0_oklch(1_0_0/0.03)] transition-[border-color,box-shadow,background] duration-[var(--duration-base)] placeholder:text-[var(--text-tertiary)] disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-[var(--accent-brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-brand)]/25",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

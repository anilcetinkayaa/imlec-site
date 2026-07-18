import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex w-fit items-center rounded-[var(--radius-sm)] border px-2.5 py-1 font-mono text-[11px] font-medium uppercase leading-none tracking-[0.08em]",
  {
    variants: {
      variant: {
        active:
          "border-[var(--success)]/30 bg-[var(--success)]/12 text-[var(--success)]",
        beta: "border-[var(--accent-brand)]/35 bg-[var(--accent-brand)]/12 text-[var(--accent-brand)]",
        "coming-soon":
          "border-[var(--warning)]/28 bg-[var(--warning)]/10 text-[var(--warning)]",
        new: "border-[var(--accent-fis260)]/35 bg-[var(--accent-fis260)]/12 text-[var(--accent-fis260)]",
      },
    },
    defaultVariants: {
      variant: "beta",
    },
  },
);

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

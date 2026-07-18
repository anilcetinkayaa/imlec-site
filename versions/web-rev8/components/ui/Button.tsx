import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] text-sm font-medium transition-[background,border-color,color,box-shadow,transform] duration-[var(--duration-base)] ease-[var(--ease-out-expo)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--text-primary)] text-[var(--surface-0)] shadow-[0_0_0_1px_oklch(1_0_0/0.06),0_8px_28px_oklch(0.70_0.18_250/0.18)] hover:-translate-y-px hover:bg-white hover:shadow-[0_0_0_1px_oklch(1_0_0/0.08),0_12px_34px_oklch(0.70_0.18_250/0.24)]",
        brand:
          "border border-[var(--accent-brand)]/40 bg-[var(--accent-brand)]/16 text-[var(--text-primary)] shadow-[0_0_0_1px_oklch(1_0_0/0.04)] hover:-translate-y-px hover:bg-[var(--accent-brand)]/22 hover:shadow-[0_12px_34px_oklch(0.70_0.18_250/0.18)]",
        ghost:
          "text-[var(--text-secondary)] hover:bg-white/[0.045] hover:text-[var(--text-primary)]",
        outline:
          "border border-[var(--border-default)] bg-white/[0.025] text-[var(--text-primary)] hover:border-white/20 hover:bg-white/[0.055]",
        destructive:
          "border border-[var(--danger)]/35 bg-[var(--danger)]/12 text-[var(--text-primary)] hover:bg-[var(--danger)]/18",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-11 px-5 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };

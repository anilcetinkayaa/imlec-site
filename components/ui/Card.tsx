import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/cn";

const cardVariants = cva(
  "rounded-[var(--radius-md)] border text-[var(--text-primary)] transition-[background,border-color,box-shadow,transform] duration-[var(--duration-base)] ease-[var(--ease-out-expo)]",
  {
    variants: {
      variant: {
        default: "border-[var(--border-subtle)] bg-[var(--surface-1)]/70",
        elevated:
          "border-[var(--border-default)] bg-[var(--surface-2)]/72 shadow-[0_24px_70px_oklch(0_0_0/0.28)]",
        interactive:
          "border-[var(--border-subtle)] bg-[var(--surface-1)]/70 hover:-translate-y-px hover:border-[var(--accent-brand)]/40 hover:bg-[var(--surface-2)]/78 hover:shadow-[0_18px_60px_oklch(0_0_0/0.26)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type CardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants>;

function Card({ className, variant, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cn("grid gap-1.5 p-5", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-h4 text-[var(--text-primary)]", className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-body-s text-[var(--text-secondary)]", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-5 pt-0", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center gap-3 p-5 pt-0", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
};

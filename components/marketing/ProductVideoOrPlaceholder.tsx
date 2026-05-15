import { Play } from "lucide-react";
import { cn } from "@/lib/cn";

type ProductVideoOrPlaceholderProps = {
  placeholder: boolean;
  src?: string;
  label?: string;
  className?: string;
};

export function ProductVideoOrPlaceholder({
  placeholder,
  src,
  label = "Demo yakında",
  className,
}: ProductVideoOrPlaceholderProps) {
  if (!placeholder && src) {
    return (
      <video
        data-slot="product-video"
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className={cn(
          "aspect-video w-full bg-[var(--surface-2)] object-cover",
          className,
        )}
      />
    );
  }

  return (
    <div
      data-slot="product-video-placeholder"
      className={cn(
        "grid aspect-video w-full place-items-center border-t border-[var(--border-subtle)] bg-[var(--surface-2)]",
        className,
      )}
    >
      <div className="grid justify-items-center gap-3 text-center">
        <span className="grid size-14 place-items-center rounded-full border border-[var(--border-default)] bg-[var(--surface-3)] text-[var(--text-primary)]">
          <Play aria-hidden="true" className="size-5" strokeWidth={1.5} />
        </span>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </p>
        <p className="max-w-xs text-sm leading-6 text-[var(--text-tertiary)]">
          Ürün akışını gösteren kısa demo bu alana eklenecek.
        </p>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

const products = [
  {
    name: "FİŞ260",
    href: "/fis260",
    description: "Muhasebe OCR ve Excel aktarım uygulaması.",
    status: "active" as const,
    statusLabel: "Aktif",
    accentClass: "bg-[var(--accent-fis260)]/16 text-[var(--accent-fis260)]",
    mark: "F",
  },
  {
    name: "ÇÖZVER",
    href: "/cozver",
    description: "Finansal analiz ve spread hazırlığı ürünü.",
    status: "coming-soon" as const,
    statusLabel: "Geliştiriliyor",
    accentClass: "bg-[var(--accent-cozver)]/16 text-[var(--accent-cozver)]",
    mark: "Ç",
  },
];

function ProductIcon({
  mark,
  className,
}: {
  mark: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-16 shrink-0 place-items-center rounded-[var(--radius-md)] border border-white/10 font-mono text-xl font-semibold",
        className,
      )}
    >
      {mark}
    </span>
  );
}

export function ProductSwitcher() {
  return (
    <details className="group/product relative hidden lg:block">
      <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-white/[0.025] px-3 text-sm text-[var(--text-secondary)] transition hover:border-white/20 hover:bg-white/[0.05] hover:text-[var(--text-primary)] [&::-webkit-details-marker]:hidden">
        Ürünler
        <ChevronDown
          aria-hidden="true"
          className="size-4 transition-transform group-open/product:rotate-180"
          strokeWidth={1.5}
        />
      </summary>
      <div className="absolute left-0 top-12 z-50 w-[420px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-2 shadow-[0_28px_80px_oklch(0_0_0/0.48)]">
        {products.map((product) => (
          <Link
            key={product.name}
            href={product.href}
            className="grid grid-cols-[64px_1fr] gap-4 rounded-[var(--radius-md)] p-3 transition hover:bg-white/[0.045]"
          >
            <ProductIcon mark={product.mark} className={product.accentClass} />
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {product.name}
                </span>
                <Badge variant={product.status}>{product.statusLabel}</Badge>
              </span>
              <span className="mt-1 block text-sm leading-6 text-[var(--text-secondary)]">
                {product.description}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </details>
  );
}

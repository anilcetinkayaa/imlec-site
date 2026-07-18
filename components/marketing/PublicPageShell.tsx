import type { CSSProperties, ReactNode } from "react";
import { Footer } from "@/components/marketing/Footer";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Rev9Atmosphere } from "@/components/rev9/Rev9Atmosphere";
import { cn } from "@/lib/cn";

type PublicPageShellProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function PublicPageShell({
  children,
  className,
  style,
}: PublicPageShellProps) {
  return (
    <main
      className={cn(
        "rev9-page rev9-public-page relative isolate min-h-screen overflow-hidden bg-transparent text-[var(--text-primary)]",
        className,
      )}
      style={style}
    >
      <Rev9Atmosphere />
      <SiteHeader />
      <div className="relative z-10">{children}</div>
      <Footer />
    </main>
  );
}

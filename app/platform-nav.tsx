import { SiteHeader } from "@/components/marketing/SiteHeader";

type PlatformNavProps = {
  compact?: boolean;
};

export async function PlatformNav({ compact = false }: PlatformNavProps) {
  return <SiteHeader compact={compact} />;
}

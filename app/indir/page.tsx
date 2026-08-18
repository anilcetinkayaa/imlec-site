import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowDown, Download, MessageCircle } from "lucide-react";
import { AutoDownload } from "@/components/marketing/AutoDownload";
import { PublicPageShell } from "@/components/marketing/PublicPageShell";
import {
  SmartScreenSteps,
  SmartScreenTrustBanner,
} from "@/components/marketing/SmartScreenSteps";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "İmleç Launcher İndir | İmleç Yazılım",
  description:
    "İmleç Launcher indirmesi otomatik başlar. Windows güvenlik uyarısı görürseniz iki adımda geçin: Ek bilgi → Yine de çalıştır.",
};

const LAUNCHER_URL = "/api/downloads/launcher";

export default function IndirPage() {
  return (
    <PublicPageShell>
      <AutoDownload href={LAUNCHER_URL} />
      <section className="mx-auto w-full max-w-4xl px-6 pb-24 pt-16 sm:px-8">
        <div className="text-center">
          <p className="text-label font-mono text-[var(--accent-brand)]">
            İmleç Launcher
          </p>
          <h1 className="mt-4 text-display text-[var(--text-primary)]">
            İndirmeniz başladı.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-body-l text-[var(--text-secondary)]">
            İndirme kendiliğinden başlamadıysa aşağıdaki düğmeyi kullanın.
            Kurulum sırasında Windows mavi bir güvenlik uyarısı gösterirse
            endişelenmeyin — bu sayfadaki iki adımla geçilir.
          </p>
          <div className="mt-7 flex justify-center">
            <Button asChild variant="brand" size="lg">
              <Link href={LAUNCHER_URL}>
                <Download aria-hidden="true" strokeWidth={1.5} />
                İndirmeyi yeniden başlat
              </Link>
            </Button>
          </div>
        </div>

        {/* Dikkat cekici yonlendirme: "indirmeniz basladi"yi goren asagiyi
            okumayabilir — uyari renkli, zipar oklu serit asagiya cagirir */}
        <div className="mt-12 rounded-[var(--radius-lg)] border-2 border-[color-mix(in_oklch,var(--warning),transparent_35%)] bg-[color-mix(in_oklch,var(--warning),transparent_88%)] p-6 shadow-[0_0_50px_color-mix(in_oklch,var(--warning),transparent_80%)]">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
            <AlertTriangle
              className="size-10 shrink-0 text-[var(--warning)]"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <div className="flex-1">
              <p className="text-h4 text-[var(--text-primary)]">
                DURUN — kurmadan önce bunu bilin:
              </p>
              <p className="mt-1 text-body text-[var(--text-secondary)]">
                İndirilen dosyayı açtığınızda Windows{" "}
                <strong className="text-[var(--text-primary)]">
                  mavi bir güvenlik penceresi
                </strong>{" "}
                gösterecek. Bu normaldir ve{" "}
                <strong className="text-[var(--text-primary)]">
                  aşağıdaki 2 adımla
                </strong>{" "}
                geçilir.
              </p>
            </div>
            <ArrowDown
              className="size-9 shrink-0 animate-bounce text-[var(--warning)]"
              strokeWidth={2}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="mt-8">
          <SmartScreenTrustBanner />
        </div>

        <div className="mt-12">
          <SmartScreenSteps />
        </div>

        <div className="mt-14 grid gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 text-center">
          <p className="text-body font-semibold text-[var(--text-primary)]">
            Takıldığınız bir adım olursa yalnız değilsiniz.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="outline" size="md">
              <Link href="mailto:info@imlecyazilim.com?subject=Kurulum yardımı">
                <MessageCircle aria-hidden="true" strokeWidth={1.5} />
                Destek isteyin
              </Link>
            </Button>
            <Button asChild variant="ghost" size="md">
              <Link href="/kurulum">Ayrıntılı kurulum rehberi</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}

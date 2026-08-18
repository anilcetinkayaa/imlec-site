import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, Download, MessageCircle, ShieldCheck } from "lucide-react";
import { AutoDownload } from "@/components/marketing/AutoDownload";
import { PublicPageShell } from "@/components/marketing/PublicPageShell";
import { SmartScreenSteps } from "@/components/marketing/SmartScreenSteps";
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
            Dosya inince açın; kurulum bu sayfadaki iki küçük adımla tamamlanır.
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

        {/* Goze carpan ama SAKINLESTIREN rehber karti (18.08 geri bildirimi:
            "DURUN"lu turuncu uyari endiselendiriyordu — yesil "guvenli" tonu,
            "her sey yolunda" dili) */}
        <div className="mt-12 rounded-[var(--radius-lg)] border border-[color-mix(in_oklch,var(--success),transparent_50%)] bg-[color-mix(in_oklch,var(--success),transparent_90%)] p-7 shadow-[0_0_60px_color-mix(in_oklch,var(--success),transparent_86%)]">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <ShieldCheck
              className="size-11 shrink-0 text-[var(--success)]"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <div className="flex-1">
              <p className="text-h4 text-[var(--text-primary)]">
                Her şey yolunda — kurulum 2 küçük adım sürer.
              </p>
              <p className="mt-1.5 text-body text-[var(--text-secondary)]">
                Windows, yeni tanıdığı her programda mavi bir onay penceresi
                gösterir; İmleç Yazılım kurulum dosyası{" "}
                <strong className="text-[var(--text-primary)]">
                  dijital olarak imzalıdır
                </strong>{" "}
                ve bu pencere tamamen normaldir. Aşağıdaki iki resimli adımla
                saniyeler içinde geçersiniz.
              </p>
            </div>
            <div className="flex flex-col items-center gap-1 text-[var(--success)]">
              <span className="text-label">Adımlar</span>
              <ArrowDown
                className="size-7 animate-bounce"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </div>
          </div>
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

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ClipboardCheck, Download, MessageCircle } from "lucide-react";
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

        {/* Ton dengesi (18.08, 3. deneme): "DURUN" korkutuyordu, "her sey
            yolunda" ise okunmuyordu. Orta yol = GEREKLILIK dili: marka mavisi,
            "kurulumun parcasi, yapilmasi gerekiyor" cercevesi. */}
        <div className="mt-12 rounded-[var(--radius-lg)] border-2 border-[color-mix(in_oklch,var(--accent-brand),transparent_40%)] bg-[color-mix(in_oklch,var(--accent-brand),transparent_88%)] p-7 shadow-[0_0_55px_color-mix(in_oklch,var(--accent-brand),transparent_82%)]">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <ClipboardCheck
              className="size-11 shrink-0 text-[var(--accent-brand)]"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <div className="flex-1">
              <p className="text-h4 text-[var(--text-primary)]">
                Kurulum için aşağıdaki 2 adım gerekli.
              </p>
              <p className="mt-1.5 text-body text-[var(--text-secondary)]">
                İndirilen dosyayı açtığınızda Windows mavi bir onay penceresi
                gösterir; kurulumun tamamlanması için penceredeki{" "}
                <strong className="text-[var(--text-primary)]">
                  “Ek bilgi” → “Yine de çalıştır”
                </strong>{" "}
                adımlarını uygulamanız gerekir. Resimli anlatım hemen aşağıda —
                dosya dijital imzalıdır, güvendesiniz.
              </p>
            </div>
            <div className="flex flex-col items-center gap-1 text-[var(--accent-brand)]">
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

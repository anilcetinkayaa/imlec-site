import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PublicPageShell } from "@/components/marketing/PublicPageShell";
import {
  SmartScreenSteps,
  SmartScreenTrustBanner,
} from "@/components/marketing/SmartScreenSteps";

export const metadata: Metadata = {
  title: "Kurulum Rehberi | İmleç Yazılım",
  description:
    "İmleç Launcher kurulumunda Windows'un gösterdiği güvenlik uyarısını iki adımda geçin: Ek bilgi → Yine de çalıştır.",
};

export default function KurulumPage() {
  return (
    <PublicPageShell>
      <section className="mx-auto w-full max-w-4xl px-6 pb-24 pt-16 sm:px-8">
        <div className="text-center">
          <p className="text-label font-mono text-[var(--accent-brand)]">
            Kurulum rehberi
          </p>
          <h1 className="mt-4 text-display text-[var(--text-primary)]">
            Windows uyarısı gördünüz mü? Sorun yok.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-body-l text-[var(--text-secondary)]">
            Windows, yeni tanıdığı her programda bu mavi uyarıyı herkese
            gösterir. Bu bir hata ya da virüs değildir. Aşağıdaki iki adımla
            kurulum sorunsuz tamamlanır.
          </p>
        </div>

        <div className="mt-10">
          <SmartScreenTrustBanner />
        </div>

        <div className="mt-14">
          <SmartScreenSteps />
        </div>

        <div className="mt-14 grid gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2
              className="size-5 text-[var(--success)]"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <p className="text-body font-semibold text-[var(--text-primary)]">
              Kurulum bittikten sonra bu uyarıyı bir daha görmezsiniz.
            </p>
          </div>
          <p className="text-body-s text-[var(--text-secondary)]">
            Takıldığınız bir adım olursa bize yazın; birlikte, adım adım
            ilerleyelim.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button asChild variant="brand" size="md">
              <Link href="mailto:info@imlecyazilim.com?subject=Kurulum yardımı">
                <MessageCircle aria-hidden="true" strokeWidth={1.5} />
                Destek isteyin
              </Link>
            </Button>
            <Button asChild variant="outline" size="md">
              <Link href="/indir">Launcher&apos;ı indir</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}

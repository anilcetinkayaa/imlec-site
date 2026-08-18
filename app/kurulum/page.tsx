import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  CheckCircle2,
  ImageIcon,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PublicPageShell } from "@/components/marketing/PublicPageShell";

export const metadata: Metadata = {
  title: "Kurulum Rehberi | İmleç Yazılım",
  description:
    "İmleç Launcher kurulumunda Windows'un gösterdiği güvenlik uyarısını iki adımda geçin: Ek bilgi → Yine de çalıştır.",
};

// Kullanıcının aldığı gerçek ekran görüntüleri buraya konur; dosya henüz
// yoksa sayfa şık bir yer tutucu gösterir (yayın görselleri beklemez).
const GUIDE_DIR = "guides/smartscreen";

function guideAsset(fileName: string) {
  const publicPath = path.join(process.cwd(), "public", GUIDE_DIR, fileName);
  return existsSync(publicPath) ? `/${GUIDE_DIR}/${fileName}` : null;
}

function StepVisual({
  src,
  alt,
  note,
}: {
  src: string | null;
  alt: string;
  note: string;
}) {
  if (!src) {
    return (
      <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-tertiary)]">
        <ImageIcon className="size-8" strokeWidth={1.25} aria-hidden="true" />
        <span className="text-body-s">{note}</span>
      </div>
    );
  }
  return (
    // Rehber görselleri boyutu değişken kullanıcı ekran görüntüleridir
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] shadow-[0_20px_60px_oklch(0_0_0/0.35)]"
    />
  );
}

const steps = [
  {
    number: "1",
    title: "Mavi uyarı penceresinde “Ek bilgi” yazısına tıklayın",
    description:
      "Pencerede küçük, altı çizili “Ek bilgi” (bazı bilgisayarlarda “More info”) yazısı vardır. Ona bir kez tıklayın.",
    asset: "adim-1.png",
    assetNote: "Ekran görüntüsü eklenecek: Ek bilgi adımı",
  },
  {
    number: "2",
    title: "Açılan “Yine de çalıştır” düğmesine tıklayın",
    description:
      "“Ek bilgi”ye tıklayınca altta “Yine de çalıştır” (İngilizce kurulumlarda “Run anyway”) düğmesi belirir. Ona tıklayın; kurulum hemen başlar.",
    asset: "adim-2.png",
    assetNote: "Ekran görüntüsü eklenecek: Yine de çalıştır adımı",
  },
];

export default function KurulumPage() {
  const videoSrc = guideAsset("kurulum.mp4");
  const gifSrc = guideAsset("kurulum.gif");

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

        <div className="mt-10 flex items-start gap-4 rounded-[var(--radius-lg)] border border-[color-mix(in_oklch,var(--success),transparent_60%)] bg-[color-mix(in_oklch,var(--success),transparent_90%)] p-6">
          <ShieldCheck
            className="mt-0.5 size-6 shrink-0 text-[var(--success)]"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <div>
            <p className="text-body font-semibold text-[var(--text-primary)]">
              İmleç Yazılım kurulum dosyaları dijital olarak imzalıdır.
            </p>
            <p className="mt-1 text-body-s text-[var(--text-secondary)]">
              Uyarı, Microsoft&apos;un yeni yayımlanan programları henüz
              tanımamasından kaynaklanır ve zamanla kendiliğinden kaybolur.
              Bilgisayarınıza zarar verecek bir durum yoktur.
            </p>
          </div>
        </div>

        <div className="mt-14 grid gap-10">
          {steps.map((step, index) => (
            <div key={step.number} className="grid gap-5">
              <div className="flex items-center gap-5">
                <span className="grid size-14 shrink-0 place-items-center rounded-full border border-[color-mix(in_oklch,var(--accent-brand),transparent_50%)] bg-[color-mix(in_oklch,var(--accent-brand),transparent_86%)] font-mono text-2xl font-bold text-[var(--accent-brand)]">
                  {step.number}
                </span>
                <div>
                  <h2 className="text-h3 text-[var(--text-primary)]">
                    {step.title}
                  </h2>
                  <p className="mt-1.5 text-body text-[var(--text-secondary)]">
                    {step.description}
                  </p>
                </div>
              </div>
              <StepVisual
                src={guideAsset(step.asset)}
                alt={step.title}
                note={step.assetNote}
              />
              {index === 0 ? (
                <div className="flex justify-center text-[var(--text-tertiary)]">
                  <ArrowDown aria-hidden="true" strokeWidth={1.5} />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {videoSrc || gifSrc ? (
          <div className="mt-14 grid gap-4">
            <h2 className="text-h3 text-center text-[var(--text-primary)]">
              İki adımı videoda izleyin
            </h2>
            {videoSrc ? (
              <video
                src={videoSrc}
                controls
                playsInline
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)]"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gifSrc ?? ""}
                alt="Kurulum adımlarının hareketli görüntüsü"
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)]"
              />
            )}
          </div>
        ) : null}

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
              <Link href="/download">İndirme sayfasına dön</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}

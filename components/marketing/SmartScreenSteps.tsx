import { existsSync } from "node:fs";
import path from "node:path";
import {
  ArrowDown,
  BadgeCheck,
  CheckCircle2,
  HelpCircle,
  ImageIcon,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

// Kullanıcının aldığı gerçek ekran görüntüleri; dosya yoksa şık yer tutucu.
const GUIDE_DIR = "guides/smartscreen";

export function guideAsset(fileName: string) {
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

export function SmartScreenTrustBanner() {
  return (
    <div className="flex items-start gap-4 rounded-[var(--radius-lg)] border border-[color-mix(in_oklch,var(--success),transparent_60%)] bg-[color-mix(in_oklch,var(--success),transparent_90%)] p-6">
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
          Windows, yeni tanıdığı programlarda bu mavi uyarıyı herkese gösterir;
          Microsoft programı tanıdıkça uyarı kendiliğinden kaybolur.
          Bilgisayarınıza zarar verecek bir durum yoktur.
        </p>
      </div>
    </div>
  );
}

export function WhyThisWarning() {
  const reasons = [
    {
      icon: Sparkles,
      title: "Program yeni",
      text: "İmleç Launcher kısa süre önce yayımlandı. Microsoft, KİM yayımlarsa yayımlasın, her yeni programı bir süre bu pencereyle karşılar.",
    },
    {
      icon: TrendingUp,
      title: "Tanınma süreci",
      text: "Program daha çok bilgisayara kuruldukça Microsoft onu tanır. Dünyadaki her yeni Windows programı bu aşamadan geçer.",
    },
    {
      icon: CheckCircle2,
      title: "Kendiliğinden biter",
      text: "Microsoft programı tanıdığında bu pencere artık hiç çıkmaz. Sizin bir şey yapmanıza gerek kalmaz.",
    },
  ];

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-7">
      <div className="flex items-center gap-3">
        <HelpCircle
          className="size-7 shrink-0 text-[var(--accent-brand)]"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <h2 className="text-h3 text-[var(--text-primary)]">
          Bu pencere neden çıkıyor?
        </h2>
      </div>
      <p className="mt-3 text-body text-[var(--text-secondary)]">
        Bu pencerenin çıkması programın güvensiz olduğu anlamına{" "}
        <strong className="text-[var(--text-primary)]">gelmez</strong>. Bu,
        Microsoft&apos;un yeni yayımcılara uyguladığı{" "}
        <strong className="text-[var(--text-primary)]">
          standart tanıma prosedürüdür
        </strong>
        :
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {reasons.map((reason) => (
          <div
            key={reason.title}
            className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-0)] p-5"
          >
            <reason.icon
              className="size-6 text-[var(--accent-brand)]"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <p className="mt-3 text-body font-semibold text-[var(--text-primary)]">
              {reason.title}
            </p>
            <p className="mt-1.5 text-body-s text-[var(--text-secondary)]">
              {reason.text}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-body font-semibold text-[var(--text-primary)]">
        Kısacası: bu pencere “güvensiz” demek değil, “yeni” demektir.
      </p>
    </div>
  );
}

export function SmartScreenSteps() {
  const videoSrc = guideAsset("kurulum.mp4");
  const gifSrc = guideAsset("kurulum.gif");

  return (
    <div className="grid gap-10">
      <WhyThisWarning />
      {steps.map((step, index) => (
        <div key={step.number} className="grid gap-5">
          <div className="flex items-center gap-5">
            <span className="grid size-14 shrink-0 place-items-center rounded-full border border-[color-mix(in_oklch,var(--accent-brand),transparent_50%)] bg-[color-mix(in_oklch,var(--accent-brand),transparent_86%)] font-mono text-2xl font-bold text-[var(--accent-brand)]">
              {step.number}
            </span>
            <div>
              <h2 className="text-h3 text-[var(--text-primary)]">{step.title}</h2>
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
          {index === 1 ? (
            <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[color-mix(in_oklch,var(--accent-brand),transparent_60%)] bg-[color-mix(in_oklch,var(--accent-brand),transparent_92%)] p-5">
              <BadgeCheck
                className="mt-0.5 size-5 shrink-0 text-[var(--accent-brand)]"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <p className="text-body-s text-[var(--text-secondary)]">
                Bu pencerede <strong className="text-[var(--text-primary)]">Yayımcı</strong>{" "}
                satırında <strong className="text-[var(--text-primary)]">“Anıl Çetinkaya”</strong>{" "}
                adını görürsünüz. İmleç Yazılım bir şahıs şirketidir; dijital
                imza sertifikaları yasal olarak şirket kurucusunun adına
                düzenlenir. Bu adı görmeniz, dosyanın{" "}
                <strong className="text-[var(--text-primary)]">
                  gerçekten İmleç Yazılım&apos;a ait ve değiştirilmemiş
                </strong>{" "}
                olduğunun kanıtıdır. Şirket bilgilerimizi{" "}
                <a
                  href="/hakkimizda"
                  className="font-medium text-[var(--accent-brand)] underline-offset-2 hover:underline"
                >
                  Hakkımızda
                </a>{" "}
                sayfasından doğrulayabilirsiniz.
              </p>
            </div>
          ) : null}
          {index === 0 ? (
            <div className="flex justify-center text-[var(--text-tertiary)]">
              <ArrowDown aria-hidden="true" strokeWidth={1.5} />
            </div>
          ) : null}
        </div>
      ))}

      {videoSrc || gifSrc ? (
        <div className="grid gap-4">
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
    </div>
  );
}

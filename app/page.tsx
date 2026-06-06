import Image from "next/image";
import Link from "next/link";
import type * as React from "react";
import {
  ArrowRight,
  Download,
  KeyRound,
  MonitorCheck,
  ShieldCheck,
} from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { ProductVideoOrPlaceholder } from "@/components/marketing/ProductVideoOrPlaceholder";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CHANGELOG_ENTRIES } from "@/lib/changelog";
import { FIS260_DEMO_VIDEO_SRC, VIDEO_PLACEHOLDER } from "@/lib/config";
import fis260Preview from "@/public/fis260-preview.png";

const pillars = [
  {
    icon: KeyRound,
    title: "ÃœrÃ¼n eriÅŸimi",
    description:
      "SatÄ±n alÄ±nan masaÃ¼stÃ¼ Ã¼rÃ¼nleri tek hesap altÄ±nda gÃ¶rÃ¼nÃ¼r ve yÃ¶netilir.",
    chip: "Cihaz baÅŸÄ±na lisans",
  },
  {
    icon: Download,
    title: "GÃ¼venli indirme",
    description:
      "Kurulum dosyalarÄ± Ã¼yelik ve Ã¼rÃ¼n eriÅŸimi kontrolÃ¼nden sonra sunulur.",
    chip: "256-bit imzalÄ± kurulum",
  },
  {
    icon: MonitorCheck,
    title: "Cihaz yÃ¶netimi",
    description:
      "Desktop oturumlarÄ± Ã¼yelik durumunu ve cihaz doÄŸrulamasÄ±nÄ± web hesabÄ±yla eÅŸler.",
    chip: "30 gÃ¼nde bir gÃ¼ncelleme",
  },
];

const products = [
  {
    name: "FÄ°Å260",
    href: "/fis260",
    status: "active" as const,
    statusLabel: "Aktif",
    description:
      "FiÅŸ gÃ¶rsellerinden alanlarÄ± Ã§Ä±karan, kontrol akÄ±ÅŸÄ±yla Excel Ã§Ä±ktÄ±sÄ± hazÄ±rlayan Windows uygulamasÄ±.",
    tags: ["Muhasebe OCR", "Excel aktarÄ±m", "Windows 10/11"],
    accent: "var(--accent-fis260)",
    mark: "F",
    featured: true,
  },
  {
    name: "Ã‡Ã–ZVER",
    href: "/cozver",
    status: "coming-soon" as const,
    statusLabel: "GeliÅŸtiriliyor",
    description:
      "Finansal analiz ve spread hazÄ±rlÄ±ÄŸÄ± iÃ§in geliÅŸtirilen ikinci masaÃ¼stÃ¼ Ã¼rÃ¼n.",
    tags: ["Finansal analiz", "Spread", "YakÄ±nda"],
    accent: "var(--accent-cozver)",
    mark: "Ã‡",
    featured: false,
  },
];

const steps = [
  ["01", "YÃ¼kle", "FiÅŸ gÃ¶rsellerini FÄ°Å260 Ã§alÄ±ÅŸma alanÄ±na alÄ±n."],
  ["02", "OCR", "AlanlarÄ± uygulama iÃ§inde otomatik olarak Ã§Ä±karÄ±n."],
  ["03", "Kontrol", "Eksik veya hatalÄ± alanlarÄ± aktarÄ±m Ã¶ncesi gÃ¶zden geÃ§irin."],
  ["04", "Excel", "Muhasebe akÄ±ÅŸÄ±na uygun Excel Ã§Ä±ktÄ±sÄ±nÄ± oluÅŸturun."],
];

function WindowChrome({
  title,
  children,
  skew = false,
}: {
  title: string;
  children: React.ReactNode;
  skew?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] shadow-[0_32px_90px_oklch(0_0_0/0.42)] ${
        skew ? "lg:rotate-[-1.25deg]" : ""
      }`}
    >
      <div className="flex h-10 items-center justify-between border-b border-[var(--border-subtle)] bg-white/[0.035] px-4">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-14 pt-16 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 lg:pb-20 lg:pt-20">
      <div className="pointer-events-none absolute right-[-160px] top-10 size-[600px] rounded-full bg-[var(--accent-brand)] opacity-[0.18] blur-[120px] motion-safe:animate-[spin_12s_linear_infinite]" />
      <div className="relative z-10 flex flex-col justify-center">
        <p className="text-label mb-6 font-mono text-[var(--accent-brand)]">
          MasaÃ¼stÃ¼ finans araÃ§larÄ±
        </p>
        <h1 className="text-display max-w-4xl text-[var(--text-primary)]">
          Muhasebe ve finans ekipleri iÃ§in TÃ¼rkiye&apos;nin masaÃ¼stÃ¼ yazÄ±lÄ±m
          platformu.
        </h1>
        <p className="text-body-l mt-7 max-w-2xl text-[var(--text-secondary)]">
          Ä°mleÃ§ YazÄ±lÄ±m; Ã¼rÃ¼n eriÅŸimi, gÃ¼venli indirme ve cihaz doÄŸrulama
          akÄ±ÅŸlarÄ±nÄ± tek hesap altÄ±nda toplayan B2B masaÃ¼stÃ¼ yazÄ±lÄ±m
          platformudur.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/api/downloads/launcher">
              <Download aria-hidden="true" strokeWidth={1.5} />
              Windows iÃ§in indir
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/products">
              ÃœrÃ¼nleri incele
              <ArrowRight aria-hidden="true" strokeWidth={1.5} />
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative z-10 self-center">
        <WindowChrome title="FÄ°Å260.exe" skew>
          <Image
            src={fis260Preview}
            alt="FÄ°Å260 masaÃ¼stÃ¼ uygulama ekran gÃ¶rÃ¼ntÃ¼sÃ¼"
            priority
            className="h-auto w-full"
          />
        </WindowChrome>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <section className="border-y border-[var(--border-subtle)] bg-[var(--surface-0)]/70 px-6 py-3 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl font-mono text-xs text-[var(--text-tertiary)]">
        Beta v0.1.0 â€¢ TÃ¼rkiye merkezli â€¢ KVKK uyumlu â€¢ Windows 10/11 desteÄŸi
      </div>
    </section>
  );
}

function PlatformPillars() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
      <SectionHeader
        eyebrow="Platform yaklaÅŸÄ±mÄ±"
        title="Ãœyelik, indirme ve cihaz doÄŸrulama aynÄ± hesapta birleÅŸir."
        lead="Web platformu masaÃ¼stÃ¼ Ã¼rÃ¼nlerin daÄŸÄ±tÄ±m ve eriÅŸim katmanÄ±dÄ±r. KullanÄ±cÄ± uygulamayÄ± indirir, kurar ve aynÄ± hesapla masaÃ¼stÃ¼ oturumunu aÃ§ar."
      />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <Card key={pillar.title} variant="interactive" className="p-5">
              <span className="grid size-10 place-items-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--accent-brand)]">
                <Icon aria-hidden="true" className="size-5" strokeWidth={1.5} />
              </span>
              <h3 className="text-h4 mt-5 text-[var(--text-primary)]">
                {pillar.title}
              </h3>
              <p className="text-body-s mt-2 text-[var(--text-secondary)]">
                {pillar.description}
              </p>
              <span className="mt-5 inline-flex rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-[11px] text-[var(--text-tertiary)]">
                {pillar.chip}
              </span>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function ProductEcosystem() {
  return (
    <section
      id="products"
      className="mx-auto max-w-7xl border-t border-[var(--border-subtle)] px-6 py-16 sm:px-8 lg:px-10"
    >
      <SectionHeader
        eyebrow="ÃœrÃ¼n ekosistemi"
        title="AynÄ± platformda ayrÄ± masaÃ¼stÃ¼ Ã¼rÃ¼nleri."
        lead="Her Ã¼rÃ¼n kendi Ã¼yelik, eriÅŸim ve indirme akÄ±ÅŸÄ±na sahiptir. Hesap yapÄ±sÄ± ortaktÄ±r; Ã¼rÃ¼n sahipliÄŸi ayrÄ± yÃ¶netilir."
      />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {products.map((product) => (
          <Card
            key={product.name}
            variant="interactive"
            className={`p-6 ${product.featured ? "lg:col-span-2" : ""}`}
            style={{ "--product-accent": product.accent } as React.CSSProperties}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="grid size-16 place-items-center rounded-[var(--radius-md)] border border-white/10 bg-[var(--product-accent)]/15 font-mono text-xl font-semibold text-[var(--product-accent)]">
                  {product.mark}
                </span>
                <div>
                  <p className="text-label font-mono text-[var(--product-accent)]">
                    {product.name === "FÄ°Å260" ? "Muhasebe OCR" : "Finansal analiz"}
                  </p>
                  <h3 className="text-h3 mt-1 text-[var(--text-primary)]">
                    {product.name}
                  </h3>
                </div>
              </div>
              <Badge variant={product.status}>{product.statusLabel}</Badge>
            </div>
            <p className="text-body mt-5 max-w-2xl text-[var(--text-secondary)]">
              {product.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--text-secondary)]"
                >
                  {tag}
                </span>
              ))}
            </div>
            <Button asChild variant="ghost" className="mt-7 px-0">
              <Link href={product.href}>
                ÃœrÃ¼n sayfasÄ±
                <ArrowRight aria-hidden="true" strokeWidth={1.5} />
              </Link>
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}

function ProductShowcase() {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 border-t border-[var(--border-subtle)] px-6 py-16 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:px-10">
      <div>
        <SectionHeader
          eyebrow="FÄ°Å260 akÄ±ÅŸÄ±"
          title="FiÅŸten Excel'e kÄ±sa ve kontrollÃ¼ akÄ±ÅŸ."
          lead="Uygulama masaÃ¼stÃ¼nde Ã§alÄ±ÅŸÄ±r. Web platformu Ã¼yelik, kurulum dosyasÄ± ve cihaz doÄŸrulama katmanÄ±nÄ± yÃ¶netir."
        />
        <div className="mt-8 grid gap-0">
          {steps.map(([number, title, description], index) => (
            <div key={number} className="grid grid-cols-[40px_1fr] gap-4">
              <div className="grid justify-items-center">
                <span className="grid size-9 place-items-center rounded-full border border-[var(--border-default)] bg-[var(--surface-2)] font-mono text-[11px] text-[var(--text-secondary)]">
                  {number}
                </span>
                {index < steps.length - 1 ? (
                  <span className="h-12 border-l border-dotted border-[var(--border-default)]" />
                ) : null}
              </div>
              <div className="pb-7">
                <h3 className="text-base font-medium text-[var(--text-primary)]">
                  {title}
                </h3>
                <p className="text-body-s mt-1 text-[var(--text-secondary)]">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <WindowChrome title="FÄ°Å260 demo">
        <ProductVideoOrPlaceholder
          placeholder={VIDEO_PLACEHOLDER}
          src={FIS260_DEMO_VIDEO_SRC}
        />
      </WindowChrome>
    </section>
  );
}

function SecurityStrip() {
  return (
    <section className="border-y border-[var(--border-subtle)] bg-[var(--surface-1)]/60 px-6 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[auto_1fr] lg:items-center">
        <span className="grid size-12 place-items-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--accent-brand)]">
          <ShieldCheck aria-hidden="true" className="size-6" strokeWidth={1.5} />
        </span>
        <p className="text-body text-[var(--text-secondary)]">
          Ä°mleÃ§ YazÄ±lÄ±m, Ã¼rÃ¼n eriÅŸimini web hesabÄ± Ã¼zerinden doÄŸrular. Cihaz
          kayÄ±tlarÄ± Ã¼yelik durumuyla eÅŸlenir; kurulum dosyasÄ± indirme akÄ±ÅŸÄ±
          yetkilendirilmiÅŸ route Ã¼zerinden Ã§alÄ±ÅŸÄ±r. KVKK kapsamÄ±nda hesap ve
          cihaz verileri Ã¼rÃ¼n eriÅŸimi iÃ§in sÄ±nÄ±rlÄ± tutulur.
        </p>
      </div>
    </section>
  );
}

function ChangelogTeaser() {
  return (
    <section
      id="updates"
      className="mx-auto max-w-7xl border-t border-[var(--border-subtle)] px-6 py-16 sm:px-8 lg:px-10"
    >
      <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
        <SectionHeader
          eyebrow="DeÄŸiÅŸiklikler"
          title="ÃœrÃ¼n ve platform deÄŸiÅŸiklikleri."
          lead="Son daÄŸÄ±tÄ±m notlarÄ±, Ã¼rÃ¼n eriÅŸimi ve kurulum akÄ±ÅŸÄ±ndaki deÄŸiÅŸiklikleri izleyin."
        />
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)]/70">
          {CHANGELOG_ENTRIES.map((entry) => (
            <div
              key={`${entry.version}-${entry.title}`}
              className="grid gap-3 border-t border-[var(--border-subtle)] p-5 first:border-t-0 sm:grid-cols-[160px_1fr]"
            >
              <div>
                <span className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-1 font-mono text-[11px] text-[var(--text-secondary)]">
                  {entry.version}
                </span>
                <p className="mt-3 font-mono text-xs text-[var(--text-tertiary)]">
                  {entry.date}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[var(--text-primary)]">
                  {entry.title}
                </h3>
                <p className="text-body-s mt-1 text-[var(--text-secondary)]">
                  {entry.summary}
                </p>
              </div>
            </div>
          ))}
          <div className="border-t border-[var(--border-subtle)] p-5">
            <Button asChild variant="ghost" className="px-0">
              <Link href="/changelog">
                TÃ¼m deÄŸiÅŸiklikleri gÃ¶rÃ¼ntÃ¼le
                <ArrowRight aria-hidden="true" strokeWidth={1.5} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTAFooterStrip() {
  return (
    <section className="border-t border-[var(--border-subtle)] bg-[var(--surface-1)] px-6 py-16 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-label font-mono text-[var(--accent-brand)]">
            Beta v0.1.0
          </p>
          <h2 className="text-h2 mt-4 text-[var(--text-primary)]">
            FÄ°Å260&apos;Ä± bugÃ¼n denemeye baÅŸlayÄ±n.
          </h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/api/downloads/launcher">
              <Download aria-hidden="true" strokeWidth={1.5} />
              Windows iÃ§in indir
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/fis260">
              ÃœrÃ¼n sayfasÄ±
              <ArrowRight aria-hidden="true" strokeWidth={1.5} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--surface-0)] text-[var(--text-primary)]">
      <SiteHeader />
      <HeroSection />
      <TrustBar />
      <PlatformPillars />
      <ProductEcosystem />
      <ProductShowcase />
      <SecurityStrip />
      <ChangelogTeaser />
      <CTAFooterStrip />
      <Footer />
    </main>
  );
}

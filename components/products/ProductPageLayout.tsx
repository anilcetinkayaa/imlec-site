import type { CSSProperties } from "react";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Download,
  FileSpreadsheet,
  LockKeyhole,
  MonitorDown,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Footer } from "@/components/marketing/Footer";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { cn } from "@/lib/cn";

type StatusVariant = "active" | "beta" | "coming-soon" | "new";

type ProductAction = {
  label: string;
  href: string;
  variant?: "primary" | "ghost" | "outline" | "brand";
};

type ProductStep = {
  title: string;
  description: string;
};

type ProductScreen = {
  id: string;
  label: string;
  title: string;
  description: string;
  image?: StaticImageData;
  alt?: string;
  placeholder?: string;
};

type ProductTier = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref?: string;
  disabled?: boolean;
};

type RelatedProduct = {
  name: string;
  href: string;
  status: string;
  description: string;
  accent: string;
};

export type ProductPageConfig = {
  slug: string;
  name: string;
  accent: string;
  status: {
    label: string;
    variant: StatusVariant;
  };
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    primaryAction?: ProductAction;
    secondaryAction?: ProductAction;
  };
  audience: string[];
  steps: ProductStep[];
  screenshots: ProductScreen[];
  specs: Array<[string, string]>;
  membership: {
    eyebrow: string;
    title: string;
    description: string;
    tiers: ProductTier[];
  };
  faq: Array<{
    question: string;
    answer: string;
  }>;
  related: RelatedProduct[];
  waitlist?: {
    action?: string | null;
    note: string;
  };
};

type ProductPageLayoutProps = {
  config: ProductPageConfig;
};

function ProductIcon({ name }: { name: string }) {
  return (
    <div className="flex size-14 items-center justify-center rounded-[var(--radius-md)] border border-[color-mix(in_oklch,var(--product-accent),transparent_62%)] bg-[color-mix(in_oklch,var(--product-accent),transparent_88%)] text-[var(--text-primary)] shadow-[0_0_36px_color-mix(in_oklch,var(--product-accent),transparent_82%)]">
      <span className="font-mono text-sm font-semibold">{name.slice(0, 2)}</span>
    </div>
  );
}

function WindowFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-[0_28px_90px_oklch(0_0_0/0.38)]">
      <div className="flex h-10 items-center justify-between border-b border-[var(--border-subtle)] bg-[color-mix(in_oklch,var(--surface-2),transparent_20%)] px-4">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-mono text-[var(--text-tertiary)]">{title}</span>
      </div>
      {children}
    </div>
  );
}

function HeroActions({ config }: { config: ProductPageConfig }) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      {config.hero.primaryAction ? (
        <Button asChild size="lg" variant={config.hero.primaryAction.variant ?? "primary"}>
          <Link href={config.hero.primaryAction.href}>
            <Download className="size-4" strokeWidth={1.5} />
            {config.hero.primaryAction.label}
          </Link>
        </Button>
      ) : null}
      {config.hero.secondaryAction ? (
        <Button asChild size="lg" variant={config.hero.secondaryAction.variant ?? "outline"}>
          <Link href={config.hero.secondaryAction.href}>
            {config.hero.secondaryAction.label}
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

function WaitlistForm({ config }: { config: ProductPageConfig }) {
  if (!config.waitlist) {
    return null;
  }

  const isConnected = Boolean(config.waitlist.action);

  return (
    <form
      action={config.waitlist.action ?? undefined}
      method={isConnected ? "post" : undefined}
      className="mt-8 grid gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 sm:grid-cols-[1fr_auto]"
    >
      <Input
        aria-label={`${config.name} bekleme listesi e-posta adresi`}
        name="email"
        placeholder="E-posta adresiniz"
        type="email"
      />
      <Button disabled={!isConnected} type={isConnected ? "submit" : "button"} variant="brand">
        Hazır olduğunda haber ver
      </Button>
      <p className="text-body-s text-[var(--text-tertiary)] sm:col-span-2">
        {config.waitlist.note}
      </p>
    </form>
  );
}

export function ProductPageLayout({ config }: ProductPageLayoutProps) {
  const style = {
    "--product-accent": config.accent,
  } as CSSProperties;
  const firstScreen = config.screenshots[0]?.id;

  return (
    <main
      className="min-h-screen overflow-hidden bg-[var(--surface-0)] text-[var(--text-primary)]"
      style={style}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklch,var(--product-accent),transparent_84%),transparent_60%)]" />
      <SiteHeader />

      <section className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-16 pt-16 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 lg:pb-20 lg:pt-20">
        <div className="flex flex-col justify-center">
          <div className="mb-6 flex items-center gap-3">
            <ProductIcon name={config.name} />
            <div>
              <p className="text-label text-[color-mix(in_oklch,var(--product-accent),white_18%)]">
                {config.hero.eyebrow}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-body-s font-medium text-[var(--text-secondary)]">
                  {config.name}
                </span>
                <Badge variant={config.status.variant}>{config.status.label}</Badge>
              </div>
            </div>
          </div>
          <h1 className="text-display max-w-4xl">{config.hero.title}</h1>
          <p className="text-body-l mt-6 max-w-2xl text-[var(--text-secondary)]">
            {config.hero.lead}
          </p>
          <HeroActions config={config} />
          <WaitlistForm config={config} />
        </div>

        <WindowFrame title={`${config.name}.exe`}>
          <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-body-s font-medium text-[var(--text-primary)]">
                  Ürün çalışma alanı
                </p>
                <p className="text-body-s mt-1 text-[var(--text-tertiary)]">
                  Masaüstü uygulama deneyimi
                </p>
              </div>
              <span className="text-mono rounded-[var(--radius-sm)] border border-[color-mix(in_oklch,var(--product-accent),transparent_64%)] bg-[color-mix(in_oklch,var(--product-accent),transparent_88%)] px-2.5 py-1 text-[color-mix(in_oklch,var(--product-accent),white_20%)]">
                {config.status.label}
              </span>
            </div>
          </div>
          <div className="bg-[var(--surface-0)] p-3">
            {config.screenshots[0]?.image ? (
              <Image
                src={config.screenshots[0].image}
                alt={config.screenshots[0].alt ?? `${config.name} ekran görüntüsü`}
                priority
                className="h-auto w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)]"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-2)]">
                <div className="text-center">
                  <Sparkles
                    className="mx-auto mb-3 size-6 text-[color-mix(in_oklch,var(--product-accent),white_20%)]"
                    strokeWidth={1.5}
                  />
                  <p className="text-body-s font-medium text-[var(--text-primary)]">
                    Ekran turu hazırlanıyor
                  </p>
                  <p className="text-body-s mt-1 text-[var(--text-tertiary)]">
                    {config.screenshots[0]?.placeholder}
                  </p>
                </div>
              </div>
            )}
          </div>
        </WindowFrame>
      </section>

      <section className="relative border-y border-[var(--border-subtle)] bg-[var(--surface-1)]/55">
        <div className="mx-auto grid max-w-7xl gap-3 px-6 py-5 sm:px-8 md:grid-cols-3 lg:px-10">
          {config.audience.map((item) => (
            <div key={item} className="flex items-start gap-3 text-body-s text-[var(--text-secondary)]">
              <Check
                className="mt-0.5 size-4 shrink-0 text-[color-mix(in_oklch,var(--product-accent),white_12%)]"
                strokeWidth={1.5}
              />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section
        id="workflow"
        className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:px-8 lg:grid-cols-[0.74fr_1.26fr] lg:px-10"
      >
        <div>
          <p className="text-label text-[color-mix(in_oklch,var(--product-accent),white_18%)]">
            Çalışma akışı
          </p>
          <h2 className="text-h2 mt-4">Kontrollü ilerleyen masaüstü süreç.</h2>
          <p className="text-body mt-4 text-[var(--text-secondary)]">
            Her ürün aynı platform hesabına bağlanır, ancak uygulama içindeki iş
            akışı kendi kullanım senaryosuna göre sade tutulur.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {config.steps.map((step, index) => (
            <Card key={step.title} className="relative p-5" variant="interactive">
              <span className="text-mono text-[color-mix(in_oklch,var(--product-accent),white_10%)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-h4 mt-5">{step.title}</h3>
              <p className="text-body-s mt-3 text-[var(--text-secondary)]">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <div className="mb-8 max-w-2xl">
          <p className="text-label text-[color-mix(in_oklch,var(--product-accent),white_18%)]">
            Ekran turu
          </p>
          <h2 className="text-h2 mt-4">Ürünün ana yüzeyleri.</h2>
        </div>
        {firstScreen ? (
          <Tabs defaultValue={firstScreen}>
            <TabsList className="max-w-full flex-wrap">
              {config.screenshots.map((screen) => (
                <TabsTrigger key={screen.id} value={screen.id}>
                  {screen.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {config.screenshots.map((screen) => (
              <TabsContent key={screen.id} value={screen.id}>
                <WindowFrame title={screen.title}>
                  <div className="grid gap-0 bg-[var(--surface-0)] lg:grid-cols-[1.12fr_0.88fr]">
                    <div className="p-3">
                      {screen.image ? (
                        <Image
                          src={screen.image}
                          alt={screen.alt ?? screen.title}
                          className="h-auto w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)]"
                        />
                      ) : (
                        <div className="flex aspect-video items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-2)]">
                          <p className="text-body-s text-[var(--text-tertiary)]">
                            {screen.placeholder}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-[var(--border-subtle)] p-6 lg:border-l lg:border-t-0">
                      <p className="text-label text-[var(--text-tertiary)]">{screen.label}</p>
                      <h3 className="text-h3 mt-4">{screen.title}</h3>
                      <p className="text-body mt-4 text-[var(--text-secondary)]">
                        {screen.description}
                      </p>
                    </div>
                  </div>
                </WindowFrame>
              </TabsContent>
            ))}
          </Tabs>
        ) : null}
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:px-10">
        <div>
          <p className="text-label text-[color-mix(in_oklch,var(--product-accent),white_18%)]">
            Teknik bilgiler
          </p>
          <h2 className="text-h2 mt-4">Web hesabıyla yönetilen ürün erişimi.</h2>
          <p className="text-body mt-4 text-[var(--text-secondary)]">
            İndirme, yetki ve cihaz katmanları web platformunda kalır. Masaüstü
            uygulama, aktif ürün erişimini kullanıcı hesabıyla doğrular.
          </p>
        </div>
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)]">
          {config.specs.map(([label, value]) => (
            <div
              key={label}
              className="grid grid-cols-[minmax(120px,0.42fr)_1fr] border-t border-[var(--border-subtle)] px-4 py-3 first:border-t-0"
            >
              <span className="text-body-s text-[var(--text-tertiary)]">{label}</span>
              <span className="text-mono text-[var(--text-primary)]">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section
        id="uyelikler"
        className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10"
      >
        <div className="mb-8 max-w-3xl">
          <p className="text-label text-[color-mix(in_oklch,var(--product-accent),white_18%)]">
            {config.membership.eyebrow}
          </p>
          <h2 className="text-h2 mt-4">{config.membership.title}</h2>
          <p className="text-body mt-4 text-[var(--text-secondary)]">
            {config.membership.description}
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {config.membership.tiers.map((tier) => (
            <Card
              key={tier.name}
              className={cn("p-6", tier.disabled && "opacity-72")}
              variant="elevated"
            >
              <p className="text-body-s font-medium text-[var(--text-secondary)]">
                {tier.name}
              </p>
              <div className="mt-4 flex items-end gap-2">
                <span className="font-mono text-4xl font-semibold tracking-[-0.02em]">
                  {tier.price}
                </span>
                <span className="pb-1 text-body-s text-[var(--text-tertiary)]">
                  {tier.period}
                </span>
              </div>
              <p className="text-body-s mt-4 text-[var(--text-secondary)]">
                {tier.description}
              </p>
              <ul className="mt-6 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-body-s text-[var(--text-secondary)]">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-[color-mix(in_oklch,var(--product-accent),white_12%)]"
                      strokeWidth={1.5}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                asChild={Boolean(tier.ctaHref && !tier.disabled)}
                className="mt-7 w-full"
                disabled={tier.disabled}
                variant={tier.disabled ? "outline" : "brand"}
              >
                {tier.ctaHref && !tier.disabled ? (
                  <Link href={tier.ctaHref}>{tier.ctaLabel}</Link>
                ) : (
                  <span>{tier.ctaLabel}</span>
                )}
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:px-10">
        <div>
          <p className="text-label text-[color-mix(in_oklch,var(--product-accent),white_18%)]">
            Sık sorulanlar
          </p>
          <h2 className="text-h2 mt-4">Karar öncesi netlik.</h2>
        </div>
        <Accordion
          className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-5"
          collapsible
          type="single"
        >
          {config.faq.map((faq, index) => (
            <AccordionItem key={faq.question} value={`item-${index}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-label text-[color-mix(in_oklch,var(--product-accent),white_18%)]">
              İlgili ürünler
            </p>
            <h2 className="text-h2 mt-4">Aynı hesap altında ürün ailesi.</h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/#products">
              Platform ürünleri
              <ChevronRight className="size-4" strokeWidth={1.5} />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {config.related.map((product) => (
            <Card
              key={product.name}
              className="p-5"
              style={{ "--related-accent": product.accent } as CSSProperties}
              variant="interactive"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="flex size-12 items-center justify-center rounded-[var(--radius-md)] border border-[color-mix(in_oklch,var(--related-accent),transparent_62%)] bg-[color-mix(in_oklch,var(--related-accent),transparent_88%)]">
                    {product.name === "FİŞ260" ? (
                      <FileSpreadsheet className="size-5" strokeWidth={1.5} />
                    ) : (
                      <MonitorDown className="size-5" strokeWidth={1.5} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-h4">{product.name}</h3>
                    <p className="text-body-s mt-2 max-w-xl text-[var(--text-secondary)]">
                      {product.description}
                    </p>
                  </div>
                </div>
                <span className="text-mono rounded-[var(--radius-sm)] border border-[var(--border-subtle)] px-2 py-1 text-[var(--text-tertiary)]">
                  {product.status}
                </span>
              </div>
              <Link
                className="mt-5 inline-flex items-center gap-2 text-body-s font-medium text-[var(--text-primary)] transition-colors hover:text-[color-mix(in_oklch,var(--related-accent),white_18%)]"
                href={product.href}
              >
                Ürün sayfası
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--border-subtle)] bg-[var(--surface-1)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-14 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div>
            <p className="text-label text-[var(--text-tertiary)]">{config.name}</p>
            <h2 className="text-h2 mt-3">Ürün erişimini web hesabınızdan yönetin.</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {config.hero.primaryAction ? (
              <Button asChild size="lg" variant="primary">
                <Link href={config.hero.primaryAction.href}>
                  {config.hero.primaryAction.label}
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="outline">
                <Link href="/#products">Platformu incele</Link>
              </Button>
            )}
            <Button asChild size="lg" variant="ghost">
              <Link href="/account">
                <LockKeyhole className="size-4" strokeWidth={1.5} />
                Hesabıma git
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

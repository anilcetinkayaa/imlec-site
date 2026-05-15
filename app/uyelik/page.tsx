import type { Metadata } from "next";
import Link from "next/link";
import {
  Check,
  Download,
  MonitorCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { auth } from "@/auth";
import { Footer } from "@/components/marketing/Footer";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  MEMBERSHIP_CURRENCY,
  MEMBERSHIP_PRICE_TRY,
} from "@/lib/config";
import { buildLemonSqueezyCheckoutUrl } from "@/lib/lemonsqueezy-checkout";

export const metadata: Metadata = {
  title: "Üyelikler | İmleç Yazılım",
  description:
    "İmleç Yazılım test aşaması üyelik bilgileri ve FİŞ260 ürün erişimi talep akışı.",
};

const includedItems = [
  {
    icon: Check,
    title: "FİŞ260 erişimi",
    description: "Test sürecinde onaylanan hesaplara FİŞ260 ürün erişimi tanımlanır.",
  },
  {
    icon: Download,
    title: "Güvenli indirme",
    description: "Kurulum dosyası mevcut korumalı download akışı üzerinden sunulur.",
  },
  {
    icon: MonitorCheck,
    title: "Cihaz doğrulama",
    description: "Masaüstü uygulama, web hesabına bağlı ürün erişimini kontrol eder.",
  },
  {
    icon: ShieldCheck,
    title: "Güncellemeler dahil",
    description: "Test sürümü boyunca uygun güncellemeler aynı ürün erişimiyle izlenir.",
  },
];

function plannedPriceLabel() {
  const formattedPrice = new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: MEMBERSHIP_CURRENCY,
  }).format(MEMBERSHIP_PRICE_TRY);

  return `Ticari sürümde aylık ${formattedPrice} olarak planlanmaktadır.`;
}

export default async function MembershipPage() {
  const session = await auth();
  const checkoutUrl =
    session?.user?.id && session.user.email && process.env.LEMONSQUEEZY_FIS260_CHECKOUT_URL
      ? buildLemonSqueezyCheckoutUrl({
          checkoutUrl: process.env.LEMONSQUEEZY_FIS260_CHECKOUT_URL,
          email: session.user.email,
          userId: session.user.id,
          productSlug: "fis260",
        })
      : null;

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--surface-0)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_50%_0%,oklch(0.70_0.18_250/0.14),transparent_62%)]" />
      <SiteHeader />

      <section className="relative mx-auto max-w-5xl px-6 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="mb-8 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3 sm:flex-row sm:items-center">
          <Badge variant="beta">Test Aşaması</Badge>
          <p className="text-body-s text-[var(--text-secondary)]">
            Bu ürün şu an test aşamasındadır. Üyelikler davet ve onay ile verilmektedir.
          </p>
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <p className="text-label text-[var(--accent-brand)]">Üyelikler</p>
          <h1 className="text-h1 mt-4">
            FİŞ260 test erişimi için üyelik talebi oluşturun.
          </h1>
          <p className="text-body-l mx-auto mt-5 max-w-2xl text-[var(--text-secondary)]">
            İmleç Yazılım şu anda kontrollü test sürecindedir. Hesap oluşturduktan
            sonra ürün erişimi davet ve onay akışıyla tanımlanır.
          </p>
        </div>

        <Card className="mx-auto mt-10 max-w-2xl p-6 sm:p-8" variant="elevated">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--accent-fis260)]/30 bg-[var(--accent-fis260)]/12 text-[var(--accent-fis260)]">
                <Sparkles className="size-6" strokeWidth={1.5} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-h3">FİŞ260</h2>
                  <Badge variant="beta">Test Aşaması</Badge>
                </div>
                <p className="text-body-s mt-2 text-[var(--text-secondary)]">
                  Windows masaüstü OCR ve Excel aktarım uygulaması.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
            <p className="text-body-s text-[var(--text-tertiary)]">Fiyat</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
              Şu an ücretsiz — test süreci
            </p>
            <p className="text-mono mt-3 text-[var(--text-tertiary)]">
              {plannedPriceLabel()}
            </p>
          </div>

          <div className="mt-8">
            <h3 className="text-h4">Neleri kapsıyor</h3>
            <div className="mt-5 grid gap-4">
              {includedItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="flex gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--accent-brand)]">
                      <Icon className="size-4" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-body-s font-medium text-[var(--text-primary)]">
                        {item.title}
                      </p>
                      <p className="text-body-s mt-1 text-[var(--text-secondary)]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-body-s max-w-md text-[var(--text-tertiary)]">
              Ödeme formu bulunmaz. Ticari ödeme akışı hazır olduğunda ayrıca duyurulur.
            </p>
            <Button asChild size="lg" variant="primary">
              <Link href="/register">Üyelik talebi oluştur</Link>
            </Button>
            {checkoutUrl ? (
              <Button asChild size="lg" variant="outline">
                <Link href={checkoutUrl}>Test checkout</Link>
              </Button>
            ) : null}
          </div>
        </Card>
      </section>

      <Footer />
    </main>
  );
}

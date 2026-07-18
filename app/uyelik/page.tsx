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
import { PublicPageShell } from "@/components/marketing/PublicPageShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  MEMBERSHIP_CURRENCY,
  MEMBERSHIP_PRICE_TRY,
} from "@/lib/config";
import { getLemonSqueezyMode } from "@/lib/lemonsqueezy-config";
import { startFis260Checkout } from "@/app/uyelik/actions";

export const metadata: Metadata = {
  title: "Abone ol | İmleç Yazılım",
  description:
    "İmleç Yazılım üyelik bilgileri, FİŞ260 abonelik ve ürün erişimi akışı.",
};

const includedItems = [
  {
    icon: Check,
    title: "FİŞ260 erişimi",
    description: "Aktif abonelik veya tanımlı kullanım hakkı ile FİŞ260 kullanılabilir.",
  },
  {
    icon: Download,
    title: "Güvenli indirme",
    description: "Kurulum ve güncelleme dosyaları İmleç hesabı ve cihaz kontrolüyle sunulur.",
  },
  {
    icon: MonitorCheck,
    title: "Cihaz doğrulama",
    description: "Masaüstü uygulama, web hesabınıza bağlı ürün erişimini kontrol eder.",
  },
  {
    icon: ShieldCheck,
    title: "Güncellemeler dahil",
    description: "Abonelik süresince uygun sürümler launcher üzerinden alınır.",
  },
];

function priceLabel() {
  const formattedPrice = new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: MEMBERSHIP_CURRENCY,
  }).format(MEMBERSHIP_PRICE_TRY);

  return `${formattedPrice} / ay`;
}

export default async function MembershipPage() {
  const session = await auth();
  const lemonSqueezyMode = getLemonSqueezyMode();
  const checkoutConfigured = Boolean(
    process.env.LEMONSQUEEZY_FIS260_CHECKOUT_URL,
  );

  return (
    <PublicPageShell>
      <section className="relative mx-auto max-w-5xl px-6 py-14 sm:px-8 lg:px-10 lg:py-20">
        {lemonSqueezyMode === "test" ? (
          <div className="mb-8 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-2)]/80 px-4 py-3 backdrop-blur-xl sm:flex-row sm:items-center">
            <Badge variant="beta">Test modu</Badge>
            <p className="text-body-s text-[var(--text-secondary)]">
              Bu ortamda Lemon Squeezy test ödeme akışı kullanılmaktadır.
            </p>
          </div>
        ) : null}

        <div className="mx-auto max-w-3xl text-center">
          <p className="text-label text-[var(--accent-brand)]">Abone ol</p>
          <h1 className="text-h1 mt-4">
            FİŞ260 aboneliğinizi İmleç hesabınızla başlatın.
          </h1>
          <p className="text-body-l mx-auto mt-5 max-w-2xl text-[var(--text-secondary)]">
            Ödeme Lemon Squeezy üzerinden alınır, uygulama erişimi ise İmleç
            hesabınızdaki ürün hakkı ve cihaz doğrulamasıyla yönetilir.
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
                  <Badge variant="active">7 gün deneme</Badge>
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
              {priceLabel()}
            </p>
            <p className="text-mono mt-3 text-[var(--text-tertiary)]">
              İlk sürümde 7 günlük ücretsiz deneme tanımlıdır.
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
              Abonelik başarılı olunca FİŞ260 erişimi hesabınıza otomatik tanımlanır.
            </p>
            {session?.user?.id && session.user.email && checkoutConfigured ? (
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                <p className="text-body-s text-[var(--text-tertiary)]">
                  {session.user.email} hesabı için
                </p>
                <form action={startFis260Checkout}>
                  <Button size="lg" type="submit" variant="primary">
                    Abone ol
                  </Button>
                </form>
              </div>
            ) : session?.user?.id ? (
              <div className="max-w-sm text-right">
                <p className="text-body-s text-[var(--text-secondary)]">
                  Abonelik işlemi şu anda kullanılamıyor. Lütfen daha sonra tekrar
                  deneyin veya destekle iletişime geçin.
                </p>
                <Button asChild className="mt-3" size="lg" variant="outline">
                  <Link href="mailto:destek@imlecyazilim.com">Destek ile iletişime geç</Link>
                </Button>
              </div>
            ) : (
              <Button asChild size="lg" variant="primary">
                <Link href="/login?callbackUrl=/uyelik">Giriş yap ve abone ol</Link>
              </Button>
            )}
          </div>
        </Card>
      </section>
    </PublicPageShell>
  );
}

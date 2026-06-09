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
import { prisma } from "@/src/db/prisma";
import { requestFis260AccessFromMembershipPage } from "@/app/download/actions";

export const metadata: Metadata = {
  title: "Üyelikler | İmleç Yazılım",
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

type MembershipPageProps = {
  searchParams: Promise<{
    request?: string;
    product?: string;
  }>;
};

function AccessRequestSuccessBanner() {
  return (
    <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--success)]/25 bg-[var(--success)]/8 px-4 py-4">
      <Badge variant="active">Talep gönderildi</Badge>
      <h2 className="text-h4 mt-3">Erişim talebiniz gönderildi.</h2>
      <p className="text-body-s mt-2 max-w-2xl text-[var(--text-secondary)]">
        İnceleme sonrasında hesabınıza manuel erişim tanımlanabilir. Erişim
        onaylandığında bilgilendirme maili alırsınız.
      </p>
    </div>
  );
}

export default async function MembershipPage({ searchParams }: MembershipPageProps) {
  const session = await auth();
  const params = await searchParams;
  const checkoutUrl =
    session?.user?.id && session.user.email && process.env.LEMONSQUEEZY_FIS260_CHECKOUT_URL
      ? buildLemonSqueezyCheckoutUrl({
          checkoutUrl: process.env.LEMONSQUEEZY_FIS260_CHECKOUT_URL,
          email: session.user.email,
          userId: session.user.id,
          productSlug: "fis260",
        })
      : null;
  const pendingRequest = session?.user?.id
    ? await prisma.accessRequest.findUnique({
        where: {
          userId_productCode: {
            userId: session.user.id,
            productCode: "fis260",
          },
        },
        select: {
          status: true,
        },
      })
    : null;
  const hasPendingRequest = pendingRequest?.status === "PENDING";
  const showAccessRequestSent =
    params.request === "sent" && params.product === "fis260";

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--surface-0)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_50%_0%,oklch(0.70_0.18_250/0.14),transparent_62%)]" />
      <SiteHeader />

      <section className="relative mx-auto max-w-5xl px-6 py-14 sm:px-8 lg:px-10 lg:py-20">
        {showAccessRequestSent ? <AccessRequestSuccessBanner /> : null}

        <div className="mb-8 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3 sm:flex-row sm:items-center">
          <Badge variant="beta">Test Mode</Badge>
          <p className="text-body-s text-[var(--text-secondary)]">
            Şu an Lemon Squeezy test ödeme akışı aktiftir. Live mode bilgileri ayrıca girilecektir.
          </p>
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <p className="text-label text-[var(--accent-brand)]">Üyelikler</p>
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
            {checkoutUrl ? (
              <Button asChild size="lg" variant="primary">
                <Link href={checkoutUrl}>Aboneliği başlat</Link>
              </Button>
            ) : session?.user?.id ? (
              <form action={requestFis260AccessFromMembershipPage}>
                <Button
                  disabled={hasPendingRequest}
                  size="lg"
                  type="submit"
                  variant="outline"
                >
                  {hasPendingRequest ? "Talep beklemede" : "Manuel erişim talebi"}
                </Button>
              </form>
            ) : (
              <Button asChild size="lg" variant="primary">
                <Link href="/login?callbackUrl=/uyelik">Giriş yap ve aboneliği başlat</Link>
              </Button>
            )}
          </div>
        </Card>
      </section>

      <Footer />
    </main>
  );
}

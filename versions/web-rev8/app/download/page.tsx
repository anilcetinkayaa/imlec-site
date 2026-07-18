import type { Metadata } from "next";
import Link from "next/link";
import {
  Check,
  Download,
  FileDown,
  LockKeyhole,
  MessageCircle,
  MonitorDown,
  ShieldCheck,
} from "lucide-react";
import { auth } from "@/auth";
import { Footer } from "@/components/marketing/Footer";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  FIS260_INSTALLER_SHA256,
  FIS260_INSTALLER_SIZE_BYTES,
  FIS260_INSTALLER_VERSION,
  LAUNCHER_INSTALLER_SHA256,
  LAUNCHER_INSTALLER_SIZE_BYTES,
  LAUNCHER_INSTALLER_VERSION,
} from "@/lib/config";
import { prisma } from "@/src/db/prisma";
import { getUserProductAccess } from "@/src/server/entitlements";
import { requestFis260Access } from "./actions";

export const metadata: Metadata = {
  title: "İndir | İmleç Yazılım",
  description:
    "İmleç Yazılım hesabınıza bağlı masaüstü ürünlerin Windows kurulum dosyalarını indirin.",
};

const productDownloadMeta: Record<
  string,
  {
    version: string;
    sizeBytes: number;
    sha256: string;
    href: string;
    compatibility: string;
  }
> = {
  launcher: {
    version: LAUNCHER_INSTALLER_VERSION,
    sizeBytes: LAUNCHER_INSTALLER_SIZE_BYTES,
    sha256: LAUNCHER_INSTALLER_SHA256,
    href: "/api/downloads/launcher",
    compatibility: "Windows 10/11",
  },
  fis260: {
    version: FIS260_INSTALLER_VERSION,
    sizeBytes: FIS260_INSTALLER_SIZE_BYTES,
    sha256: FIS260_INSTALLER_SHA256,
    href: "/api/downloads/launcher",
    compatibility: "Windows 10/11",
  },
};

function formatFileSize(bytes: number) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(bytes / 1024 / 1024);
}

function LoginGate() {
  return (
    <Card className="mx-auto max-w-2xl p-7 text-center sm:p-9" variant="elevated">
      <div className="mx-auto flex size-14 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--accent-brand)]">
        <LockKeyhole className="size-6" strokeWidth={1.5} />
      </div>
      <Badge className="mt-6" variant="beta">
        Korumalı indirme
      </Badge>
      <h1 className="text-h2 mt-5">Önce giriş yapın.</h1>
      <p className="text-body mt-4 text-[var(--text-secondary)]">
        Kurulum dosyaları ürün erişimi olan hesaplara açıktır. Giriş yaptıktan
        sonra hesabınıza bağlı indirilebilir ürünleri burada görebilirsiniz.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" variant="primary">
          <Link href="/login?callbackUrl=/download">Giriş yap</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/register">Hesap oluştur</Link>
        </Button>
      </div>
    </Card>
  );
}

function AccessRequestButton({ disabled = false }: { disabled?: boolean }) {
  return (
    <form action={requestFis260Access}>
      <Button className="w-full" disabled={disabled} type="submit" variant="primary">
        {disabled ? "Talep beklemede" : "Erişim talebinde bulun"}
      </Button>
    </form>
  );
}

function AccessRequiredNotice({ hasPendingRequest }: { hasPendingRequest: boolean }) {
  return (
    <Card className="p-6 sm:p-7" variant="elevated">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--accent-fis260)]/25 bg-[var(--accent-fis260)]/10 text-[var(--accent-fis260)]">
            <LockKeyhole className="size-6" strokeWidth={1.5} />
          </div>
          <div>
            <Badge variant="beta">Ürün erişimi gerekli</Badge>
            <h2 className="text-h3 mt-4">
              Bu hesap için FİŞ260 erişimi henüz tanımlanmamış.
            </h2>
            <p className="text-body mt-3 max-w-2xl text-[var(--text-secondary)]">
              İndirme yapabilmek için hesabınıza deneme veya üyelik erişimi atanmalıdır.
            </p>
            <p className="text-body-s mt-3 max-w-2xl text-[var(--text-tertiary)]">
              Hesap açmak oturum oluşturur; FİŞ260 kurulumu için ayrıca ürün erişimi
              gerekir. Erişiminiz sonradan kaldırıldıysa da aynı kontrol uygulanır.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:min-w-48">
          <AccessRequestButton disabled={hasPendingRequest} />
          <Button asChild variant="outline">
            <Link href="mailto:info@imlecyazilim.com">
              <MessageCircle className="size-4" strokeWidth={1.5} />
              Destek ile iletişime geç
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function AccessRequestSentBanner() {
  return (
    <Card className="border-[var(--success)]/25 bg-[var(--success)]/8 p-5" variant="default">
      <Badge variant="active">Talep gönderildi</Badge>
      <h2 className="text-h4 mt-3">Erişim talebiniz gönderildi.</h2>
      <p className="text-body-s mt-2 max-w-2xl text-[var(--text-secondary)]">
        İnceleme sonrası hesabınıza erişim tanımlanacaktır. Erişim onayı
        verildiğinde bilgilendirme maili alacaksınız.
      </p>
    </Card>
  );
}

function DownloadCard({
  product,
}: {
  product: {
    slug: string;
    name: string;
    hasAccess: boolean;
    entitlementStatus: string;
  };
}) {
  const meta = productDownloadMeta[product.slug];
  const isLauncher = product.slug === "launcher";
  const canDownload = product.hasAccess || isLauncher;

  if (!meta) {
    return null;
  }

  return (
    <Card className="p-6" variant="elevated">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--accent-fis260)]/30 bg-[var(--accent-fis260)]/12 text-[var(--accent-fis260)]">
            <MonitorDown className="size-6" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-h3">{product.name}</h2>
              <Badge variant={canDownload ? "active" : "coming-soon"}>
                {canDownload ? "İndirilebilir" : "Erişim yok"}
              </Badge>
            </div>
            <p className="text-body-s mt-2 text-[var(--text-secondary)]">
              {isLauncher
                ? "Uygulamalarinizi indirip guncelleyen masaustu merkez."
                : "Bu urun Imlec Yazilim Merkezi uzerinden kurulur ve guncellenir."}
            </p>
          </div>
        </div>
        <Button asChild={canDownload} disabled={!canDownload} size="lg">
          {canDownload ? (
            <Link href={meta.href}>
              <Download className="size-4" strokeWidth={1.5} />
              İndir
            </Link>
          ) : (
            <span>İndirme kapalı</span>
          )}
        </Button>
      </div>

      <div className="mt-6 grid gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:grid-cols-3">
        <div>
          <p className="text-body-s text-[var(--text-tertiary)]">Sürüm</p>
          <p className="text-mono mt-1 text-[var(--text-primary)]">{meta.version}</p>
        </div>
        <div>
          <p className="text-body-s text-[var(--text-tertiary)]">Boyut</p>
          <p className="text-mono mt-1 text-[var(--text-primary)]">
            {formatFileSize(meta.sizeBytes)} MB
          </p>
        </div>
        <div>
          <p className="text-body-s text-[var(--text-tertiary)]">Uyumluluk</p>
          <p className="text-mono mt-1 text-[var(--text-primary)]">
            {meta.compatibility}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
        <p className="text-body-s text-[var(--text-tertiary)]">SHA-256</p>
        <p className="text-mono mt-2 break-all text-[var(--text-primary)]">
          {meta.sha256}
        </p>
      </div>

      <Accordion className="mt-4" collapsible type="single">
        <AccordionItem
          className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4"
          value="previous-versions"
        >
          <AccordionTrigger>Önceki sürümler</AccordionTrigger>
          <AccordionContent>
            Şu anda yalnızca güncel test sürümü indirilebilir durumdadır.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

type DownloadPageProps = {
  searchParams: Promise<{
    reason?: string;
    request?: string;
    product?: string;
  }>;
};

export default async function DownloadPage({ searchParams }: DownloadPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="min-h-screen overflow-hidden bg-[var(--surface-0)] text-[var(--text-primary)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_0%,oklch(0.70_0.18_250/0.14),transparent_62%)]" />
        <SiteHeader />
        <section className="relative mx-auto max-w-5xl px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
          <LoginGate />
        </section>
        <Footer />
      </main>
    );
  }

  const products = await getUserProductAccess(session.user.id);
  const downloadableProducts = products.filter(
    (product) => product.slug in productDownloadMeta,
  );
  const launcherProduct = products.find((product) => product.slug === "launcher") ?? {
    id: "launcher",
    slug: "launcher",
    name: "İmleç Yazılım Merkezi",
    hasAccess: true,
    entitlementStatus: "PUBLIC",
  };
  const ownedProducts = [
    launcherProduct,
    ...downloadableProducts.filter((product) => product.slug !== "launcher" && product.hasAccess),
  ];
  const params = await searchParams;
  const showAccessRequiredNotice =
    params.reason === "access-required" && params.product === "fis260";
  const showRequestSentBanner =
    params.request === "sent" && params.product === "fis260";
  const pendingFis260Request = await prisma.accessRequest.findUnique({
    where: {
      userId_productCode: {
        userId: session.user.id,
        productCode: "fis260",
      },
    },
    select: {
      status: true,
    },
  });
  const hasPendingFis260Request = pendingFis260Request?.status === "PENDING";

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--surface-0)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_0%,oklch(0.70_0.18_250/0.14),transparent_62%)]" />
      <SiteHeader />

      <section className="relative mx-auto max-w-6xl px-6 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-label text-[var(--accent-brand)]">İndirme merkezi</p>
          <h1 className="text-h1 mt-4">Hesabınıza bağlı masaüstü uygulamalar.</h1>
          <p className="text-body-l mt-5 text-[var(--text-secondary)]">
            İndirme butonları mevcut korumalı route üzerinden çalışır. Ürün
            erişiminiz yoksa kurulum dosyası bu sayfadan veya API route&apos;undan
            alınamaz.
          </p>
        </div>

        <div className="mt-8 grid gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4 md:grid-cols-3">
          {[
            "Oturum kontrolü",
            "Ürün erişimi doğrulama",
            "GitHub release redirect",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-body-s text-[var(--text-secondary)]">
              <Check className="size-4 text-[var(--success)]" strokeWidth={1.5} />
              {item}
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-5">
          {showRequestSentBanner ? <AccessRequestSentBanner /> : null}
          {showAccessRequiredNotice ? (
            <AccessRequiredNotice hasPendingRequest={hasPendingFis260Request} />
          ) : null}

          {ownedProducts.length > 0 ? (
            ownedProducts.map((product) => (
              <DownloadCard key={product.id} product={product} />
            ))
          ) : showAccessRequiredNotice ? null : (
            <Card className="p-6" variant="elevated">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-tertiary)]">
                    <FileDown className="size-6" strokeWidth={1.5} />
                  </div>
                  <div>
                    <Badge variant="coming-soon">Ürün erişimi gerekli</Badge>
                    <h2 className="text-h3 mt-3">
                      Bu hesap için FİŞ260 erişimi henüz tanımlanmamış.
                    </h2>
                    <p className="text-body-s mt-2 max-w-2xl text-[var(--text-secondary)]">
                      İndirme yapabilmek için hesabınıza deneme veya üyelik erişimi
                      atanmalıdır.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:min-w-48">
                  <AccessRequestButton disabled={hasPendingFis260Request} />
                  <Button asChild variant="outline">
                    <Link href="mailto:info@imlecyazilim.com">
                      <MessageCircle className="size-4" strokeWidth={1.5} />
                      Destek ile iletişime geç
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        <Card className="mt-5 p-5" variant="default">
          <div className="flex gap-3">
            <ShieldCheck
              className="mt-0.5 size-5 shrink-0 text-[var(--accent-brand)]"
              strokeWidth={1.5}
            />
            <p className="text-body-s text-[var(--text-secondary)]">
              Bu sayfa dosyayı proxy&apos;lemez. Yetki kontrolü tamamlandığında mevcut
              download route&apos;u GitHub release asset adresine yönlendirir.
            </p>
          </div>
        </Card>
      </section>

      <Footer />
    </main>
  );
}

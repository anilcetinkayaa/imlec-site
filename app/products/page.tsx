import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PublicPageShell } from "@/components/marketing/PublicPageShell";

export const metadata: Metadata = {
  title: "Ürünler | İmleç Yazılım",
  description:
    "İmleç Yazılım masaüstü ürünleri: FİŞ260, ÇÖZVER ve KUYVERA. Her ürünün kısa önizlemesi, durumu ve ayrıntı sayfası.",
};

type ProductPreview = {
  slug: string;
  name: string;
  accent: string;
  eyebrow: string;
  status: { label: string; variant: "active" | "coming-soon" };
  lead: string;
  highlights: string[];
  detailHref: string;
  subscribe?: { label: string; href: string };
};

const products: ProductPreview[] = [
  {
    slug: "fis260",
    name: "FİŞ260",
    accent: "var(--accent-fis260)",
    eyebrow: "Fiş işleme ve Excel",
    status: { label: "Satışta", variant: "active" },
    lead: "Kağıt fişleri fotoğraftan okur, muhasebenin beklediği alanları çıkarır ve tek tıkla Excel'e döker.",
    highlights: [
      "Firma, VKN, tarih, toplamlar ve KDV kırılımı otomatik",
      "Emin olamadığı alanı boş bırakır ve Excel'de işaretler",
      "Tamamen yerel çalışır; fiş verisi bilgisayardan çıkmaz",
    ],
    detailHref: "/fis260",
    subscribe: { label: "Aboneliği başlat", href: "/uyelik" },
  },
  {
    slug: "cozver",
    name: "ÇÖZVER",
    accent: "var(--accent-cozver)",
    eyebrow: "Finansal analiz",
    status: { label: "Çok yakında", variant: "coming-soon" },
    lead: "Finansal analiz ve spread hazırlığını tek masaüstü yüzeyinde düzenleyen ikinci İmleç ürünü.",
    highlights: [
      "Belge tabanlı analiz akışı tek çalışma alanında",
      "Spread çıktıları ekiplerin kullandığı formatlara hazırlanır",
      "Şirket hesabı altında çok kullanıcılı kullanım planlanıyor",
    ],
    detailHref: "/cozver",
  },
  {
    slug: "kuyvera",
    name: "KUYVERA",
    accent: "var(--accent-kuyvera)",
    eyebrow: "Kuyumculuk",
    status: { label: "Geliştirmede", variant: "coming-soon" },
    lead: "Kuyumcuların günlük işleyişi için geliştirilen üçüncü İmleç ürünü. Kapsam ve ekranlar yakında duyurulacak.",
    highlights: [
      "Kuyumcu iş akışına özel masaüstü uygulaması",
      "İmleç hesabı ve launcher altyapısıyla dağıtım",
      "Ayrıntılar geliştirme ilerledikçe bu sayfada",
    ],
    detailHref: "/kuyvera",
  },
];

function ProductCard({ product }: { product: ProductPreview }) {
  return (
    <article
      style={{ "--product-accent": product.accent } as CSSProperties}
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] transition duration-[var(--duration-base)] hover:border-[color-mix(in_oklch,var(--product-accent),transparent_45%)] hover:shadow-[0_24px_80px_color-mix(in_oklch,var(--product-accent),transparent_86%)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_oklch,var(--product-accent),transparent_25%)] to-transparent opacity-60 transition group-hover:opacity-100"
      />
      <div className="flex flex-1 flex-col gap-6 p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-[var(--radius-md)] border border-[color-mix(in_oklch,var(--product-accent),transparent_62%)] bg-[color-mix(in_oklch,var(--product-accent),transparent_88%)] shadow-[0_0_28px_color-mix(in_oklch,var(--product-accent),transparent_84%)]">
              <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                {product.name.slice(0, 2)}
              </span>
            </div>
            <div>
              <p className="text-label font-mono text-[color-mix(in_oklch,var(--product-accent),white_18%)]">
                {product.eyebrow}
              </p>
              <h2 className="mt-1 text-h3 text-[var(--text-primary)]">
                {product.name}
              </h2>
            </div>
          </div>
          <Badge variant={product.status.variant}>{product.status.label}</Badge>
        </div>

        <p className="text-body text-[var(--text-secondary)]">{product.lead}</p>

        <ul className="grid gap-2.5">
          {product.highlights.map((highlight) => (
            <li
              key={highlight}
              className="flex items-start gap-2.5 text-body-s text-[var(--text-secondary)]"
            >
              <Check
                aria-hidden="true"
                strokeWidth={2}
                className="mt-0.5 size-4 shrink-0 text-[color-mix(in_oklch,var(--product-accent),white_12%)]"
              />
              {highlight}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
          <Button asChild variant="outline" size="md">
            <Link href={product.detailHref}>
              Detayları gör
              <ArrowRight aria-hidden="true" strokeWidth={1.5} />
            </Link>
          </Button>
          {product.subscribe ? (
            <Button asChild variant="brand" size="md">
              <Link href={product.subscribe.href}>{product.subscribe.label}</Link>
            </Button>
          ) : (
            <span className="text-body-s text-[var(--text-tertiary)]">
              Duyuruları hesap panelinden takip edin
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ProductsPage() {
  return (
    <PublicPageShell>
      <section className="mx-auto w-full max-w-7xl px-6 pb-24 pt-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-label font-mono text-[var(--accent-brand)]">
            İmleç Yazılım ürünleri
          </p>
          <h1 className="mt-4 text-display text-[var(--text-primary)]">
            Tek platform, büyüyen ürün ailesi.
          </h1>
          <p className="mt-5 text-body-l text-[var(--text-secondary)]">
            Her ürün İmleç hesabınıza bağlanır, launcher ile kurulur ve kendi
            üyeliğiyle yönetilir. Kısa önizlemeye göz atın, ayrıntı için ürün
            sayfasına geçin.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-8 py-10 text-center">
          <h2 className="text-h3 text-[var(--text-primary)]">
            Hangi ürünün size uygun olduğundan emin değil misiniz?
          </h2>
          <p className="max-w-xl text-body text-[var(--text-secondary)]">
            Hesap oluşturun; ürünler aktif oldukça hesap panelinizden tek yerden
            erişir, üyelikleri ürün bazında başlatırsınız.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="brand" size="md">
              <Link href="/register">Hesap oluştur</Link>
            </Button>
            <Button asChild variant="outline" size="md">
              <Link href="/uyelik">FİŞ260 üyeliğini incele</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}

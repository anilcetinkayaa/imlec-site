import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Building2, Mail, MapPin } from "lucide-react";
import { PublicPageShell } from "@/components/marketing/PublicPageShell";

export const metadata: Metadata = {
  title: "Hakkımızda | İmleç Yazılım",
  description:
    "İmleç Yazılım, Anıl Çetinkaya şahıs işletmesi olarak İstanbul'da faaliyet gösteren bir masaüstü yazılım platformudur.",
};

const facts = [
  {
    icon: Building2,
    label: "Ticari yapı",
    value: "Anıl Çetinkaya — İmleç Yazılım (şahıs işletmesi)",
  },
  {
    icon: MapPin,
    label: "Konum",
    value: "Kâğıthane / İstanbul, Türkiye",
  },
  {
    icon: Mail,
    label: "İletişim",
    value: "info@imlecyazilim.com",
    href: "mailto:info@imlecyazilim.com",
  },
];

export default function HakkimizdaPage() {
  return (
    <PublicPageShell>
      <section className="mx-auto w-full max-w-4xl px-6 pb-24 pt-16 sm:px-8">
        <div className="text-center">
          <p className="text-label font-mono text-[var(--accent-brand)]">
            Hakkımızda
          </p>
          <h1 className="mt-4 text-display text-[var(--text-primary)]">
            İmleç Yazılım
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-body-l text-[var(--text-secondary)]">
            Meslek gruplarına özel, tamamen yerel çalışan Windows masaüstü
            yazılımları geliştiriyoruz. FİŞ260 ile başlayan ürün ailesi,
            ÇÖZVER ve KUYVERA ile büyüyor.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6"
            >
              <fact.icon
                className="size-6 text-[var(--accent-brand)]"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <p className="text-label mt-4 text-[var(--text-tertiary)]">
                {fact.label}
              </p>
              {fact.href ? (
                <Link
                  href={fact.href}
                  className="mt-1.5 block text-body font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-brand)]"
                >
                  {fact.value}
                </Link>
              ) : (
                <p className="mt-1.5 text-body font-semibold text-[var(--text-primary)]">
                  {fact.value}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-start gap-4 rounded-[var(--radius-lg)] border border-[color-mix(in_oklch,var(--accent-brand),transparent_55%)] bg-[color-mix(in_oklch,var(--accent-brand),transparent_90%)] p-6">
          <BadgeCheck
            className="mt-0.5 size-6 shrink-0 text-[var(--accent-brand)]"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <div>
            <p className="text-body font-semibold text-[var(--text-primary)]">
              Kurulum dosyalarımızda yayımcı adı neden “Anıl Çetinkaya”?
            </p>
            <p className="mt-1.5 text-body-s text-[var(--text-secondary)]">
              İmleç Yazılım bir şahıs işletmesi olduğu için dijital imza
              sertifikalarımız, yasal gereklilik olarak şirket kurucusu Anıl
              Çetinkaya adına düzenlenir. Windows kurulum penceresindeki
              “Yayımcı: Anıl Çetinkaya” satırı, dosyanın gerçekten İmleç
              Yazılım&apos;a ait ve değiştirilmemiş olduğunu doğrular. Ayrıntı
              için{" "}
              <Link
                href="/kurulum"
                className="font-medium text-[var(--accent-brand)] underline-offset-2 hover:underline"
              >
                kurulum rehberine
              </Link>{" "}
              bakabilirsiniz.
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6">
          <p className="text-body text-[var(--text-secondary)]">
            Çalışma ilkemiz basittir: müşteri verisi müşterinin
            bilgisayarında kalır. Ürünlerimiz belge işleme ve analiz işlerini
            tamamen yerel yapar; veri, kullanıcı istemedikçe bilgisayar
            dışına çıkmaz. Güvenlik ve kişisel veri yaklaşımımız için{" "}
            <Link
              href="/security"
              className="font-medium text-[var(--accent-brand)] underline-offset-2 hover:underline"
            >
              Güvenlik ve KVKK
            </Link>{" "}
            sayfasına bakın.
          </p>
        </div>
      </section>
    </PublicPageShell>
  );
}

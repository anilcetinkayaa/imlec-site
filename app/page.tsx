import Image from "next/image";
import Link from "next/link";
import fis260Preview from "@/public/fis260-preview.png";
import { PlatformNav } from "./platform-nav";

const products = [
  {
    name: "FİŞ260",
    status: "Aktif",
    label: "Muhasebe OCR",
    href: "/fis260",
    description:
      "Fiş görsellerini işleyen, alan kontrolü sunan ve Excel çıktısı hazırlayan Windows masaüstü uygulaması.",
    meta: ["Windows", "OCR", "Excel aktarım"],
  },
  {
    name: "ÇÖZVER",
    status: "Yakında",
    label: "Finansal analiz",
    href: "/cozver",
    description:
      "Finansal analiz ve spread hazırlığı için sakin, denetlenebilir ve masaüstü odaklı çalışma yüzeyi.",
    meta: ["Analiz", "Spread", "Planlanıyor"],
  },
];

const updates = [
  {
    version: "FİŞ260 v0.1.0",
    date: "Mayıs 2026",
    text: "İlk Windows installer hazır. Account panelinden yetkili kullanıcılar için indirilebilir.",
  },
  {
    version: "Platform hesabı",
    date: "Mayıs 2026",
    text: "Ürün erişimi, cihaz doğrulama ve download akışı tek hesap altında toplandı.",
  },
  {
    version: "ÇÖZVER hazırlığı",
    date: "Yakında",
    text: "Finansal analiz ürünü ayrı üyelik ve fiyatlandırma yapısıyla platforma eklenecek.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#08090b] text-zinc-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.14),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-[30rem] h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <PlatformNav />

      <section className="relative mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:pb-24 lg:pt-20">
        <div className="flex flex-col justify-center">
          <div className="mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-blue-200/80">
            Desktop finance tools
          </div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Finans ve muhasebe ekipleri için masaüstü yazılım platformu.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
            İmleç Yazılım, tek seferlik landing page değil; ürün erişimi,
            cihaz doğrulama, indirme ve üyelik yönetimi olan çok ürünlü bir
            desktop software ekosistemidir.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#products"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-950 transition hover:bg-white"
            >
              Ürünleri incele
            </Link>
            <Link
              href="/account"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.03] px-5 text-sm font-medium text-zinc-100 transition hover:border-white/[0.22] hover:bg-white/[0.06]"
            >
              Account paneli
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[28px] bg-blue-500/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#101216] shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
            <div className="flex h-10 items-center justify-between border-b border-white/[0.08] bg-white/[0.035] px-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className="font-mono text-[11px] text-zinc-500">
                İmleç Platform
              </span>
            </div>
            <div className="grid gap-4 border-b border-white/[0.08] bg-[#0c0d10] p-5 md:grid-cols-3">
              {["Ürün erişimi", "Installer", "Cihaz doğrulama"].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-4 py-3"
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    Platform
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">{item}</p>
                </div>
              ))}
            </div>
            <Image
              src={fis260Preview}
              alt="FİŞ260 masaüstü uygulama ekran görüntüsü"
              priority
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      <section
        id="products"
        className="relative mx-auto max-w-7xl border-t border-white/[0.08] px-6 py-14 sm:px-8 lg:px-10"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-blue-300/75">
              Ürünler
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Aynı hesap, ayrı ürünler.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-zinc-400">
            Her ürün kendi erişim, fiyatlandırma ve indirme akışına sahip olur.
            Platform ortak hesabı ve cihaz doğrulamasını sağlar.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {products.map((product) => (
            <article
              key={product.name}
              className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-6 transition hover:border-white/[0.16] hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-blue-300/75">
                    {product.label}
                  </p>
                  <h3 className="mt-5 text-3xl font-semibold tracking-tight text-white">
                    {product.name}
                  </h3>
                </div>
                <span
                  className={`rounded-md border px-2.5 py-1 font-mono text-[11px] ${
                    product.status === "Aktif"
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                      : "border-white/[0.08] bg-white/[0.03] text-zinc-400"
                  }`}
                >
                  {product.status}
                </span>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
                {product.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {product.meta.map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-white/[0.08] bg-[#0c0d10] px-2.5 py-1 text-xs text-zinc-400"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <Link
                href={product.href}
                className="mt-8 inline-flex h-11 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.04] px-5 text-sm font-medium text-zinc-100 transition hover:border-white/[0.22] hover:bg-white/[0.07]"
              >
                Ürün sayfası
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 border-t border-white/[0.08] px-6 py-14 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-blue-300/75">
            Download flow
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
            Installer akışı account panelinden yönetilir.
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-5">
          {["Üye ol", "Giriş yap", "FİŞ260 indir", "Kur", "Kullan"].map(
            (step, index) => (
              <div
                key={step}
                className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"
              >
                <p className="font-mono text-[11px] text-zinc-500">
                  0{index + 1}
                </p>
                <p className="mt-3 text-sm font-medium text-white">{step}</p>
              </div>
            ),
          )}
        </div>
      </section>

      <section
        id="updates"
        className="mx-auto max-w-7xl border-t border-white/[0.08] px-6 py-14 sm:px-8 lg:px-10"
      >
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-blue-300/75">
              Güncellemeler
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Platform değişiklikleri ve ürün notları.
            </h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/[0.08]">
            {updates.map((update) => (
              <div
                key={update.version}
                className="grid gap-2 border-t border-white/[0.07] bg-white/[0.018] p-5 first:border-t-0 sm:grid-cols-[160px_1fr]"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {update.version}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{update.date}</p>
                </div>
                <p className="text-sm leading-6 text-zinc-400">{update.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

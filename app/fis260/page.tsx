import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import fis260Preview from "@/public/fis260-preview.png";
import { PlatformNav } from "../platform-nav";

export const metadata: Metadata = {
  title: "FİŞ260 | İmleç Yazılım",
  description:
    "FİŞ260, muhasebeciler için geliştirilen Windows masaüstü OCR ve Excel aktarım uygulamasıdır.",
};

const workflow = [
  "Fiş görsellerini yükle",
  "OCR ile alanları çıkar",
  "Kontrol ekranında düzenle",
  "Excel çıktısını oluştur",
];

const features = [
  "Firma, VKN, tarih, KDV ve toplam alanlarını fiş görsellerinden çıkarır.",
  "Muhasebe akışına uygun Excel çıktısı hazırlar.",
  "Aktarım öncesi alan kontrolüyle hatalı veriyi yakalamayı kolaylaştırır.",
  "Windows masaüstünde sade, koyu ve odaklı bir çalışma düzeni sunar.",
];

const technical = [
  ["Platform", "Windows desktop"],
  ["Çıktı", "Excel uyumlu dosya"],
  ["Sürüm", "v0.1.0"],
  ["Dağıtım", "Account panel installer"],
];

const faqs = [
  {
    question: "FİŞ260 web uygulaması mı?",
    answer:
      "Hayır. FİŞ260 Windows üzerinde çalışan masaüstü uygulamasıdır. Web platformu üyelik, erişim, cihaz ve installer akışını yönetir.",
  },
  {
    question: "Installer nereden indirilir?",
    answer:
      "Ürün erişimi olan kullanıcılar giriş yaptıktan sonra Account panelinde FİŞ260 Windows installer butonunu görür.",
  },
  {
    question: "ÇÖZVER ile aynı üyelik mi?",
    answer:
      "Hayır. İmleç hesabı ortaktır; ürün erişimleri ve fiyatlandırma ürün bazında ayrı yönetilir.",
  },
];

export default function Fis260Page() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#08090b] text-zinc-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.16),transparent_58%)]" />

      <PlatformNav />

      <section className="relative mx-auto grid max-w-7xl gap-14 px-6 pb-16 pt-16 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:px-10 lg:pb-20 lg:pt-20">
        <div className="flex flex-col justify-center">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.28em] text-blue-300/80">
            FİŞ260 / Windows OCR + Excel
          </p>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Fişleri kontrollü biçimde Excel&apos;e aktarın.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-zinc-400 sm:text-lg">
            FİŞ260, muhasebe ekipleri için geliştirilen masaüstü fiş işleme
            uygulamasıdır. Görselden veri çıkarır, alanları düzenletir ve Excel
            çıktısını denetlenebilir bir akışla hazırlar.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/account"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-950 transition hover:bg-white"
            >
              Account panelden indir
            </Link>
            <a
              href="#workflow"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.03] px-5 text-sm font-medium text-zinc-100 transition hover:border-white/[0.22] hover:bg-white/[0.06]"
            >
              Akışı incele
            </a>
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
                FİŞ260.exe
              </span>
            </div>
            <div className="border-b border-white/[0.06] bg-[#0c0d10] px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    Fiş işleme ekranı
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    OCR sonucu, alan kontrolü ve Excel aktarımı
                  </p>
                </div>
                <span className="rounded-md border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 font-mono text-[11px] text-blue-200">
                  v0.1.0
                </span>
              </div>
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
        id="workflow"
        className="mx-auto max-w-7xl border-t border-white/[0.08] px-6 py-12 sm:px-8 lg:px-10"
      >
        <div className="grid gap-4 md:grid-cols-4">
          {workflow.map((step, index) => (
            <div
              key={step}
              className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5"
            >
              <p className="font-mono text-[11px] text-zinc-500">
                0{index + 1}
              </p>
              <p className="mt-4 text-sm font-medium text-white">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 border-t border-white/[0.08] px-6 py-12 sm:px-8 lg:grid-cols-2 lg:px-10">
        {features.map((feature) => (
          <div
            key={feature}
            className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5"
          >
            <div className="mb-4 h-1.5 w-1.5 rounded-full bg-blue-300" />
            <p className="text-sm leading-6 text-zinc-300">{feature}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 border-t border-white/[0.08] px-6 py-12 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-blue-300/75">
            Teknik bilgiler
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
            Web hesabıyla yönetilen masaüstü ürün.
          </h2>
          <p className="mt-4 text-sm leading-6 text-zinc-400">
            Uygulama masaüstünde çalışır; web platformu lisans, cihaz ve
            installer dağıtım katmanı olarak konumlanır.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/[0.08]">
          {technical.map(([label, value]) => (
            <div
              key={label}
              className="grid grid-cols-[140px_1fr] border-t border-white/[0.07] bg-white/[0.018] px-4 py-3 first:border-t-0"
            >
              <span className="text-sm text-zinc-500">{label}</span>
              <span className="text-sm font-medium text-white">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section
        id="pricing"
        className="mx-auto grid max-w-7xl gap-4 border-t border-white/[0.08] px-6 py-12 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-10"
      >
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-blue-300/75">
            FİŞ260 üyeliği
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
            Fiyatlandırma ürün erişimiyle netleşir.
          </h2>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-zinc-500">Başlangıç</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
                Görüşme ile
              </p>
              <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-400">
                FİŞ260 üyeliği kullanım hacmi ve ekip ihtiyacına göre
                değerlendirilir. İndirme yetkisi account panelinde görünür.
              </p>
            </div>
            <a
              href="mailto:info@imlecyazilim.com?subject=FİŞ260 üyelik bilgisi"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-950 transition hover:bg-white"
            >
              Üyelik için iletişime geç
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/[0.08] px-6 py-12 sm:px-8 lg:px-10">
        <div className="grid gap-4 lg:grid-cols-3">
          {faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-xl border border-white/[0.08] bg-white/[0.018] p-5"
            >
              <h3 className="text-base font-semibold tracking-tight text-white">
                {faq.question}
              </h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

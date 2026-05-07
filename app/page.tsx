import Image from "next/image";
import fis260Preview from "@/public/fis260-preview.png";

const productNotes = [
  "Fiş görsellerinden firma, VKN, tarih, KDV ve toplam alanlarını çıkarır.",
  "Muhasebe akışına uygun Excel çıktısı üretir.",
  "Windows masaüstünde, sade ve odaklı bir çalışma düzeni sunar.",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#08090b] text-zinc-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.18),transparent_58%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-7 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between border-b border-white/[0.08] pb-6">
          <a
            href="#"
            className="text-[15px] font-semibold tracking-tight text-white"
          >
            İmleç Yazılım
          </a>

          <div className="hidden items-center gap-7 text-sm text-zinc-400 sm:flex">
            <a href="#urunler" className="transition hover:text-white">
              Ürünler
            </a>
            <a href="#fis260" className="transition hover:text-white">
              FİŞ260
            </a>
            <a href="#cozver" className="transition hover:text-white">
              ÇÖZVER
            </a>
          </div>
        </nav>

        <section
          id="fis260"
          className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:py-20"
        >
          <div className="max-w-2xl">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.28em] text-blue-300/80">
              FİŞ260 / Windows OCR + Excel
            </p>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Fişleri kontrollü biçimde Excel’e aktarın.
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-zinc-400 sm:text-lg">
              FİŞ260, muhasebe ekipleri için geliştirilen masaüstü fiş işleme
              uygulamasıdır. Görselden veri çıkarır, alanları düzenler ve Excel
              çıktısını pratik bir kontrol akışıyla hazırlar.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-950 transition hover:bg-white"
              >
                Windows için indir
              </a>
              <a
                href="#urunler"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.03] px-5 text-sm font-medium text-zinc-100 transition hover:border-white/[0.22] hover:bg-white/[0.06]"
              >
                Ürünleri incele
              </a>
            </div>

            <div className="mt-10 grid gap-3 text-sm leading-6 text-zinc-400">
              {productNotes.map((note) => (
                <div
                  key={note}
                  className="flex gap-3 border-l border-blue-400/30 pl-4"
                >
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-300" />
                  <span>{note}</span>
                </div>
              ))}
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
                    Masaüstü
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
          id="urunler"
          className="grid gap-4 border-t border-white/[0.08] py-10 md:grid-cols-2"
        >
          <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-6">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-blue-300/75">
              Ana ürün
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
              FİŞ260
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
              Muhasebeciler için fiş okuma, alan kontrolü ve Excel aktarımını
              tek masaüstü akışında toplar.
            </p>
          </article>

          <article
            id="cozver"
            className="rounded-xl border border-white/[0.08] bg-white/[0.018] p-6"
          >
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500">
              İkinci ürün
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
              ÇÖZVER
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
              Finansal analiz ve spread hazırlığı için sakin, teknik ve
              denetlenebilir bir çalışma yüzeyi.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}

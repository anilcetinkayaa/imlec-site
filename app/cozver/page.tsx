import type { Metadata } from "next";
import Link from "next/link";
import { PlatformNav } from "../platform-nav";

export const metadata: Metadata = {
  title: "ÇÖZVER | İmleç Yazılım",
  description:
    "ÇÖZVER, finansal analiz ve spread hazırlığı için geliştirilen masaüstü odaklı çalışma yüzeyidir.",
};

const notes = [
  "Finansal analiz ve spread hazırlığı için odaklı ürün alanı.",
  "Üyelik ve fiyatlandırma FİŞ260'dan ayrı yönetilir.",
  "Detaylı ürün sayfası geliştirme aşamasındadır.",
];

export default function CozverPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#08090b] text-zinc-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.12),transparent_58%)]" />

      <PlatformNav />

      <section className="relative mx-auto flex max-w-7xl flex-col px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] text-zinc-400">
            Yakında
          </div>
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.28em] text-blue-300/80">
            ÇÖZVER / Finansal analiz
          </p>
          <h1 className="text-5xl font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Finansal analiz için sakin bir çalışma yüzeyi.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
            ÇÖZVER, İmleç Yazılım platformuna eklenecek ikinci masaüstü ürün
            alanıdır. Ortak hesap yapısını kullanır; ürün erişimi, üyelik ve
            fiyatlandırma FİŞ260&apos;dan ayrı yönetilir.
          </p>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {notes.map((note) => (
            <article
              key={note}
              className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5"
            >
              <div className="mb-4 h-1.5 w-1.5 rounded-full bg-blue-300" />
              <p className="text-sm leading-6 text-zinc-300">{note}</p>
            </article>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.018] p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500">
                Ürün ailesi
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                Çok ürünlü platform yapısına hazırlanıyor.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                ÇÖZVER aktif olduğunda Account panelinde ayrı ürün erişimi ve
                ayrı download alanı olarak görünür.
              </p>
            </div>
            <Link
              href="/#products"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.04] px-5 text-sm font-medium text-zinc-100 transition hover:border-white/[0.22] hover:bg-white/[0.07]"
            >
              Platform ürünlerine dön
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";

const products = [
  {
    name: "FİŞ260",
    label: "Muhasebe OCR",
    href: "/fis260",
    description:
      "Fiş görsellerinden alanları çıkaran, kontrol akışıyla Excel çıktısı hazırlayan Windows masaüstü uygulaması.",
  },
  {
    name: "ÇÖZVER",
    label: "Finansal analiz",
    href: "/cozver",
    description:
      "Finansal analiz ve spread hazırlığı için teknik, sakin ve denetlenebilir çalışma yüzeyi.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#08090b] text-zinc-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.16),transparent_58%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-7 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between border-b border-white/[0.08] pb-6">
          <Link
            href="/"
            className="text-[15px] font-semibold tracking-tight text-white"
          >
            İmleç Yazılım
          </Link>

          <div className="hidden items-center gap-7 text-sm text-zinc-400 sm:flex">
            <Link href="/fis260" className="transition hover:text-white">
              FİŞ260
            </Link>
            <Link href="/cozver" className="transition hover:text-white">
              ÇÖZVER
            </Link>
          </div>
        </nav>

        <section className="flex flex-1 flex-col justify-center py-16 lg:py-20">
          <div className="max-w-3xl">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.28em] text-blue-300/80">
              Masaüstü yazılım ürünleri
            </p>

            <h1 className="text-5xl font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
              İmleç Yazılım
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
              Muhasebe ve finans ekipleri için teknik, sade ve güvenilir
              masaüstü araçlar geliştiriyoruz. Her ürün kendi iş akışına,
              üyelik yapısına ve fiyatlandırmasına sahiptir.
            </p>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-2">
            {products.map((product) => (
              <article
                key={product.name}
                className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-6 transition hover:border-white/[0.16] hover:bg-white/[0.04]"
              >
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-blue-300/75">
                  {product.label}
                </p>

                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">
                  {product.name}
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
                  {product.description}
                </p>

                <Link
                  href={product.href}
                  className="mt-8 inline-flex h-11 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.04] px-5 text-sm font-medium text-zinc-100 transition hover:border-white/[0.22] hover:bg-white/[0.07]"
                >
                  İncele
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

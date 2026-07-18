import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicPageShell } from "@/components/marketing/PublicPageShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CHANGELOG_ENTRIES } from "@/lib/changelog";

export const metadata: Metadata = {
  title: "Değişiklikler | İmleç Yazılım",
  description:
    "İmleç Yazılım platformu, FİŞ260 ve ÇÖZVER ürünleri için değişiklik kayıtları.",
};

export default function ChangelogPage() {
  return (
    <PublicPageShell>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_0%,oklch(0.70_0.18_250/0.13),transparent_62%)]" />

      <section className="relative mx-auto max-w-5xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-label text-[var(--accent-brand)]">Değişiklikler</p>
          <h1 className="text-h1 mt-4">Ürün ve platform kayıtları.</h1>
          <p className="text-body-l mt-5 text-[var(--text-secondary)]">
            FİŞ260, ÇÖZVER ve web platformundaki dağıtım, erişim ve güvenlik
            değişiklikleri tarih sırasıyla izlenir.
          </p>
        </div>

        <div className="mt-10 grid gap-5">
          {CHANGELOG_ENTRIES.map((entry, index) => (
            <article
              key={`${entry.version}-${entry.title}`}
              className="grid gap-5 md:grid-cols-[180px_1fr]"
            >
              <div className="relative">
                <div className="sticky top-28">
                  <Badge variant={index === 0 ? "new" : "beta"}>
                    {entry.version}
                  </Badge>
                  <p className="text-mono mt-3 text-[var(--text-tertiary)]">
                    {entry.date}
                  </p>
                </div>
              </div>

              <Card className="p-6" variant="elevated">
                <h2 className="text-h3">{entry.title}</h2>
                <p className="text-body mt-3 text-[var(--text-secondary)]">
                  {entry.summary}
                </p>
                <ul className="mt-5 grid gap-3">
                  {entry.body.map((item) => (
                    <li
                      key={item}
                      className="border-l border-[var(--border-default)] pl-4 text-body-s text-[var(--text-secondary)]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </article>
          ))}
        </div>

        <div className="mt-10 border-t border-[var(--border-subtle)] pt-6">
          <Button asChild variant="outline">
            <Link href="/download">
              İndirme merkezine git
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </Link>
          </Button>
        </div>
      </section>

    </PublicPageShell>
  );
}

"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--surface-0)] px-6 text-[var(--text-primary)]">
      <Card className="w-full max-w-2xl p-8 text-center sm:p-10" variant="elevated">
        <p className="text-mono text-[var(--danger)]">500</p>
        <h1 className="text-h2 mt-4">Bir işlem tamamlanamadı.</h1>
        <p className="text-body mx-auto mt-4 max-w-xl text-[var(--text-secondary)]">
          Sayfa beklenmeyen bir hata ile durdu. Yeniden deneyebilir veya anasayfaya
          dönebilirsiniz.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset} type="button">
            <RotateCcw className="size-4" strokeWidth={1.5} />
            Tekrar dene
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Anasayfaya dön</Link>
          </Button>
        </div>
      </Card>
    </main>
  );
}

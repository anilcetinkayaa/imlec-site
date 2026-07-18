import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--surface-0)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border-subtle)] bg-[var(--surface-0)]/82">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10">
          <Link href="/" className="text-[15px] font-semibold tracking-tight">
            İmleç Yazılım
          </Link>
          <Link
            href="/login"
            className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            Giriş
          </Link>
        </div>
      </header>
      <section className="mx-auto flex min-h-[66vh] max-w-4xl items-center px-6 py-16 sm:px-8 lg:px-10">
        <Card className="w-full p-8 text-center sm:p-10" variant="elevated">
          <p className="text-mono text-[var(--accent-brand)]">404</p>
          <h1 className="text-h2 mt-4">Bu sayfa bulunamadı.</h1>
          <p className="text-body mx-auto mt-4 max-w-xl text-[var(--text-secondary)]">
            Aradığınız bağlantı taşınmış veya henüz platforma eklenmemiş olabilir.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/">
                <Home className="size-4" strokeWidth={1.5} />
                Anasayfaya dön
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/#products">
                <Search className="size-4" strokeWidth={1.5} />
                Ürünleri incele
              </Link>
            </Button>
          </div>
        </Card>
      </section>
      <Footer />
    </main>
  );
}

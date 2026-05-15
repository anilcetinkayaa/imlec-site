import type { Metadata } from "next";
import Link from "next/link";
import { Check, Download, KeyRound, MonitorCheck, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Güvenlik | İmleç Yazılım",
  description:
    "İmleç Yazılım ürün erişimi, cihaz doğrulama, KVKK yaklaşımı ve güvenli indirme akışı.",
};

const securityItems = [
  {
    icon: KeyRound,
    title: "Hesap tabanlı erişim",
    text: "Masaüstü ürün erişimi İmleç hesabına bağlanır. Kullanıcı oturumu ve ürün yetkisi ayrı ayrı kontrol edilir.",
  },
  {
    icon: Download,
    title: "Korumalı indirme",
    text: "Installer dosyası yalnızca yetkili kullanıcılar için mevcut download route'u üzerinden kısa süreli imzalı R2 linkine yönlendirilir.",
  },
  {
    icon: MonitorCheck,
    title: "Cihaz doğrulama",
    text: "Desktop uygulama cihaz bilgisini ürün erişimiyle eşler; kayıtlar hesap panelinde görünür hale gelir.",
  },
  {
    icon: ShieldCheck,
    title: "Sınırlı veri yaklaşımı",
    text: "Hesap, ürün ve cihaz bilgileri ürün erişimi ve güvenli kullanım amacıyla sınırlı tutulur.",
  },
];

function DataFlowDiagram() {
  return (
    <svg
      aria-label="İmleç Yazılım veri akışı diyagramı"
      className="h-auto w-full"
      role="img"
      viewBox="0 0 920 320"
    >
      <defs>
        <linearGradient id="flow" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.70 0.18 250)" stopOpacity="0.42" />
          <stop offset="100%" stopColor="oklch(0.72 0.16 220)" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <rect fill="oklch(0.18 0.01 250)" height="320" rx="16" width="920" />
      {[
        ["Kullanıcı", "Web hesabı"],
        ["Auth", "Oturum kontrolü"],
        ["Entitlement", "Ürün erişimi"],
        ["Desktop", "Cihaz doğrulama"],
      ].map(([title, subtitle], index) => {
        const x = 44 + index * 220;

        return (
          <g key={title}>
            <rect
              fill="oklch(0.22 0.01 250)"
              height="118"
              rx="12"
              stroke="oklch(0.32 0.012 250)"
              width="170"
              x={x}
              y="98"
            />
            <text fill="oklch(0.96 0 0)" fontSize="18" fontWeight="600" x={x + 22} y="150">
              {title}
            </text>
            <text fill="oklch(0.72 0.01 250)" fontSize="13" x={x + 22} y="176">
              {subtitle}
            </text>
            {index < 3 ? (
              <path
                d={`M ${x + 176} 157 L ${x + 214} 157`}
                fill="none"
                markerEnd="url(#arrow)"
                stroke="url(#flow)"
                strokeWidth="2"
              />
            ) : null}
          </g>
        );
      })}
      <defs>
        <marker
          id="arrow"
          markerHeight="8"
          markerWidth="8"
          orient="auto"
          refX="6"
          refY="4"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="oklch(0.70 0.18 250)" />
        </marker>
      </defs>
    </svg>
  );
}

export default function SecurityPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--surface-0)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_0%,oklch(0.70_0.18_250/0.13),transparent_62%)]" />
      <SiteHeader />

      <section className="relative mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="max-w-3xl">
          <Badge variant="beta">Güvenlik</Badge>
          <h1 className="text-h1 mt-5">Ürün erişimi ve indirme akışı kontrollü tutulur.</h1>
          <p className="text-body-l mt-5 text-[var(--text-secondary)]">
            İmleç Yazılım web platformu, masaüstü uygulamalar için üyelik, ürün
            erişimi, cihaz doğrulama ve güvenli indirme katmanını yönetir.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {securityItems.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className="p-5" variant="interactive">
                <div className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--accent-brand)]">
                    <Icon className="size-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-h4">{item.title}</h2>
                    <p className="text-body-s mt-2 text-[var(--text-secondary)]">
                      {item.text}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="mt-10 overflow-hidden p-4" variant="elevated">
          <DataFlowDiagram />
        </Card>

        <section id="kvkk" className="mt-10 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="text-label text-[var(--accent-brand)]">KVKK</p>
            <h2 className="text-h2 mt-4">Veri kullanım kapsamı sınırlı tutulur.</h2>
          </div>
          <Card className="p-6" variant="default">
            <div className="grid gap-4">
              {[
                "Hesap bilgileri oturum ve ürün erişimi için kullanılır.",
                "Cihaz kayıtları masaüstü uygulama doğrulaması için tutulur.",
                "Download akışı dosyayı proxy'lemez; yetki kontrolünden sonra kısa süreli imzalı R2 linkine yönlendirme yapılır.",
                "Ödeme formu test aşamasında gösterilmez; ticari ödeme akışı ayrıca tasarlanacaktır.",
              ].map((item) => (
                <div key={item} className="flex gap-3 text-body-s text-[var(--text-secondary)]">
                  <Check className="mt-0.5 size-4 shrink-0 text-[var(--success)]" strokeWidth={1.5} />
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </section>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-6 sm:flex-row">
          <Button asChild>
            <Link href="/download">İndirme merkezine git</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/account">Hesap paneli</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}

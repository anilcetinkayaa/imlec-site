import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İmleç Yazılım | Masaüstü yazılım platformu",
  description:
    "Muhasebe ve finans ekipleri için ürün erişimi, güvenli indirme ve cihaz doğrulamayı tek hesapta birleştiren masaüstü yazılım platformu.",
};

export default function HomePage() {
  return (
    <iframe
      aria-label="İmleç Yazılım ana sayfası"
      className="fixed inset-0 h-dvh w-full border-0 bg-black"
      src="/rev9-claude-source.html?mode=production"
      title="İmleç Yazılım"
    />
  );
}

import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://imlecyazilim.com"),
  title: "İmleç Yazılım",
  description:
    "İmleç Yazılım, muhasebe ve finans ekipleri için teknik, sade ve güvenilir masaüstü yazılım ürünleri geliştirir.",
  keywords: [
    "İmleç Yazılım",
    "FİŞ260",
    "ÇÖZVER",
    "muhasebe",
    "finansal analiz",
    "OCR",
    "masaüstü yazılım",
  ],
  openGraph: {
    title: "İmleç Yazılım",
    description:
      "Muhasebe ve finans ekipleri için masaüstü yazılım ürünleri.",
    images: ["/opengraph-image"],
    type: "website",
    locale: "tr_TR",
    siteName: "İmleç Yazılım",
  },
  twitter: {
    card: "summary_large_image",
    title: "İmleç Yazılım",
    description:
      "Muhasebe ve finans ekipleri için masaüstü yazılım ürünleri.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${GeistSans.variable} ${GeistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}

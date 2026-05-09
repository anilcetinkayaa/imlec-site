import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
    type: "website",
    locale: "tr_TR",
    siteName: "İmleç Yazılım",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}

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
  title: "İmleç Yazılım | FİŞ260",
  description:
    "İmleç Yazılım tarafından geliştirilen FİŞ260, muhasebeciler için masaüstü OCR ve Excel aktarım uygulamasıdır.",
  keywords: [
    "İmleç Yazılım",
    "FİŞ260",
    "muhasebe",
    "OCR",
    "fiş okuma",
    "Excel aktarımı",
  ],
  openGraph: {
    title: "İmleç Yazılım | FİŞ260",
    description:
      "Muhasebeciler için masaüstü OCR ve Excel aktarım uygulaması.",
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

import type { Metadata } from "next";
import { Rev9HomePage } from "@/components/rev9/Rev9HomePage";

export const metadata: Metadata = {
  title: "İmleç Yazılım | Masaüstü yazılım platformu",
  description:
    "Muhasebe ve finans ekipleri için ürün erişimi, güvenli indirme ve cihaz doğrulamayı tek hesapta birleştiren masaüstü yazılım platformu.",
};

export default function HomePage() {
  return <Rev9HomePage />;
}

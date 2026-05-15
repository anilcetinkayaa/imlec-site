import type { Metadata } from "next";
import { AccountOverviewContent } from "./overview-content";

export const metadata: Metadata = {
  title: "Hesap Paneli | İmleç Yazılım",
  description:
    "İmleç Yazılım ürün erişimleri, cihazlar, ödemeler ve profil bilgileri.",
};

export default function AccountPage() {
  return <AccountOverviewContent />;
}

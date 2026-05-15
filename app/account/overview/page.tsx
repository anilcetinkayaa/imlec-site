import type { Metadata } from "next";
import { AccountOverviewContent } from "../overview-content";

export const metadata: Metadata = {
  title: "Genel Bakış | İmleç Yazılım",
  description: "İmleç Yazılım hesap paneli genel bakış sayfası.",
};

export default function AccountOverviewPage() {
  return <AccountOverviewContent />;
}

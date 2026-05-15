import type { Metadata } from "next";
import { auth } from "@/auth";
import {
  AccountPageHeader,
  BillingTable,
} from "@/app/account/account-ui";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/src/db/prisma";

export const metadata: Metadata = {
  title: "Ödemeler | İmleç Yazılım",
  description: "İmleç Yazılım ödeme ve fatura kayıtları.",
};

export default async function AccountBillingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const [payments, invoices] = await Promise.all([
    prisma.payment.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.invoice.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  return (
    <>
      <AccountPageHeader
        description="Test sürecinde gerçek ödeme formu bulunmaz. Geçmiş ödeme ve fatura kayıtları veritabanında oluştuğunda burada listelenir."
        eyebrow="Ödemeler"
        title="Faturalandırma kayıtları"
      />

      <Card className="mb-5 p-5" variant="default">
        <p className="text-body-s text-[var(--text-secondary)]">
          FİŞ260 şu an test aşamasındadır. Ticari ödeme akışı aktif olmadığı için
          bu panelde yeni ödeme başlatan bir form gösterilmez.
        </p>
      </Card>

      <BillingTable invoices={invoices} payments={payments} />
    </>
  );
}

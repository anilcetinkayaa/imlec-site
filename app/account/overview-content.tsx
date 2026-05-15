import { auth } from "@/auth";
import {
  AccountPageHeader,
  ProductAccessCard,
  StatCard,
  formatDate,
  formatPaymentAmount,
} from "@/app/account/account-ui";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/src/db/prisma";
import { getUserProductAccess } from "@/src/server/entitlements";

export async function AccountOverviewContent() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const [products, latestPayment, devices] = await Promise.all([
    getUserProductAccess(session.user.id),
    prisma.payment.findFirst({
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
    prisma.device.findMany({
      where: {
        revokedAt: null,
        userId: session.user.id,
      },
      orderBy: {
        lastSeenAt: "desc",
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

  const activeProducts = products.filter((product) => product.hasAccess);

  return (
    <>
      <AccountPageHeader
        description="Ürün erişimleriniz, son indirme adımı, cihaz görünürlüğü ve üyelik durumunuz tek hesap yüzeyinde özetlenir."
        eyebrow="Genel bakış"
        title={`Merhaba, ${session.user.name ?? "İmleç kullanıcısı"}.`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Aktif ürün"
          note="Hesabınıza tanımlı erişimler"
          value={String(activeProducts.length)}
        />
        <StatCard
          label="Aktif cihaz"
          note="Revoked olmayan cihaz kayıtları"
          value={String(devices.length)}
        />
        <StatCard
          label="Son ödeme"
          note={latestPayment ? formatDate(latestPayment.paidAt) : "Kayıt yok"}
          value={
            latestPayment
              ? formatPaymentAmount(latestPayment.amount, latestPayment.currency)
              : "Yok"
          }
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          {products.map((product) => (
            <ProductAccessCard key={product.id} product={product} />
          ))}
        </div>

        <Card className="p-5" variant="elevated">
          <p className="text-label text-[var(--accent-brand)]">İndirme akışı</p>
          <h2 className="text-h3 mt-4">Kurulum dosyası korumalı route üzerinden verilir.</h2>
          <p className="text-body-s mt-3 text-[var(--text-secondary)]">
            Ürün erişiminiz aktifse FİŞ260 indirme butonu mevcut download route&apos;una
            gider. Route oturum ve entitlement kontrolünü yaptıktan sonra release
            asset adresine yönlendirir.
          </p>
          <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
            <p className="text-body-s text-[var(--text-tertiary)]">Son kontrol</p>
            <p className="text-mono mt-2 text-[var(--text-primary)]">
              {activeProducts.length > 0 ? "Ürün erişimi aktif" : "Erişim bekleniyor"}
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}

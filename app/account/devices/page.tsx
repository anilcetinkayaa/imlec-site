import type { Metadata } from "next";
import { auth } from "@/auth";
import { AccountPageHeader, DeviceTable } from "@/app/account/account-ui";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/src/db/prisma";

export const metadata: Metadata = {
  title: "Cihazlar | İmleç Yazılım",
  description: "İmleç Yazılım hesabınıza bağlı masaüstü cihaz kayıtları.",
};

export default async function AccountDevicesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const devices = await prisma.device.findMany({
    where: {
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
  });

  return (
    <>
      <AccountPageHeader
        description="Masaüstü uygulama ile doğrulanan cihazlar burada listelenir. Kaldırma işlemi için kullanıcı tarafı endpoint hazır olduğunda bu aksiyon aktif edilir."
        eyebrow="Cihazlar"
        title="Cihaz doğrulama kayıtları"
      />

      <DeviceTable devices={devices} />

      <Card className="mt-5 p-5" variant="default">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-h4">Cihaz kaldırma</h2>
            <p className="text-body-s mt-2 text-[var(--text-secondary)]">
              Şu an yalnızca yönetici panelinden kaldırma yapılır. Kullanıcıya açık
              cihaz kaldırma endpoint&apos;i eklendiğinde bu buton bağlanacak.
            </p>
          </div>
          <Button disabled variant="destructive">
            Cihazı kaldır
          </Button>
        </div>
      </Card>
    </>
  );
}

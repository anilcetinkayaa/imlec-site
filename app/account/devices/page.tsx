import type { Metadata } from "next";
import { auth } from "@/auth";
import { AccountPageHeader, DeviceTable } from "@/app/account/account-ui";
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
        description="Masaüstü uygulama ile doğrulanan cihazlar burada listelenir. Kullanmadığınız eski cihazı kaldırıp yeni cihazda tekrar giriş yapabilirsiniz."
        eyebrow="Cihazlar"
        title="Cihaz doğrulama kayıtları"
      />

      <DeviceTable devices={devices} />
    </>
  );
}

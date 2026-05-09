import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    slug: "fis260",
    name: "FİŞ260",
  },
  {
    slug: "cozver",
    name: "ÇÖZVER",
  },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: {
        slug: product.slug,
      },
      update: {
        name: product.name,
        status: "ACTIVE",
      },
      create: {
        slug: product.slug,
        name: product.name,
        status: "ACTIVE",
      },
    });
  }

  const seedUserEmail = process.env.SEED_USER_EMAIL?.trim().toLowerCase();

  if (seedUserEmail) {
    const user = await prisma.user.findUnique({
      where: {
        email: seedUserEmail,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new Error(`SEED_USER_EMAIL kullanıcısı bulunamadı: ${seedUserEmail}`);
    }

    const fis260 = await prisma.product.findUniqueOrThrow({
      where: {
        slug: "fis260",
      },
      select: {
        id: true,
      },
    });

    await prisma.entitlement.upsert({
      where: {
        userId_productId: {
          userId: user.id,
          productId: fis260.id,
        },
      },
      update: {
        status: "ACTIVE",
        source: "MANUAL",
        revokedAt: null,
        expiresAt: null,
      },
      create: {
        userId: user.id,
        productId: fis260.id,
        status: "ACTIVE",
        source: "MANUAL",
      },
    });

    console.log(`Dev entitlement oluşturuldu: ${user.email} -> FİŞ260`);
  }

  console.log("Product seed tamamlandı: FİŞ260, ÇÖZVER");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

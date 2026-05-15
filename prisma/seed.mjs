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
  const seededProducts = new Map();

  for (const product of products) {
    const seededProduct = await prisma.product.upsert({
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

    seededProducts.set(product.slug, seededProduct);
  }

  const fis260 = seededProducts.get("fis260");

  if (fis260) {
    await prisma.productVersion.upsert({
      where: {
        productId_version: {
          productId: fis260.id,
          version: "0.1.0",
        },
      },
      update: {
        minimumVersion: "0.1.0",
        releaseNotes:
          "FIS260 beta installer. Fis yukleme, OCR islemi ve Excel aktarim akisi.",
        filePath: "fis260/FIS260_Setup_v0.1.0.exe",
        sha256:
          "828466679dbe554957e93f21aa4e53f01bb055282edbad3dc283ce010ae253d0",
      },
      create: {
        productId: fis260.id,
        version: "0.1.0",
        minimumVersion: "0.1.0",
        releaseNotes:
          "FIS260 beta installer. Fis yukleme, OCR islemi ve Excel aktarim akisi.",
        filePath: "fis260/FIS260_Setup_v0.1.0.exe",
        sha256:
          "828466679dbe554957e93f21aa4e53f01bb055282edbad3dc283ce010ae253d0",
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

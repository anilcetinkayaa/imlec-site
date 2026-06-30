import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    slug: "launcher",
    name: "Imlec Yazilim Merkezi",
  },
  {
    slug: "fis260",
    name: "FIS260",
  },
  {
    slug: "cozver",
    name: "COZVER",
  },
];

async function upsertVersion(product, version) {
  await prisma.productVersion.upsert({
    where: {
      productId_version: {
        productId: product.id,
        version: version.version,
      },
    },
    update: {
      minimumVersion: version.minimumVersion,
      releaseNotes: version.releaseNotes,
      filePath: version.filePath,
      sha256: version.sha256,
    },
    create: {
      productId: product.id,
      version: version.version,
      minimumVersion: version.minimumVersion,
      releaseNotes: version.releaseNotes,
      filePath: version.filePath,
      sha256: version.sha256,
    },
  });
}

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

  const launcher = seededProducts.get("launcher");
  const fis260 = seededProducts.get("fis260");

  if (launcher) {
    await upsertVersion(launcher, {
      version: "0.1.3",
      minimumVersion: "0.1.2",
      releaseNotes:
        "Suresi dolan oturumlarda otomatik giris ekranina donus ve anlasilir yeniden giris bildirimi.",
      filePath:
        "https://github.com/anilcetinkayaa/imlec-site/releases/download/v0.1.1-launcher/ImlecLauncher-0.1.3-windows-x64.zip",
      sha256: "3bb07fe62292f3569016a623ac17780461d3d574027d02c19027127f4e789dc8",
    });
  }

  if (fis260) {
    await upsertVersion(fis260, {
      version: "0.1.1",
      minimumVersion: "0.1.0",
      releaseNotes:
        "Guncel kullanici arayuzu, imzali Windows uygulamasi, guvenli guncelleme ve PDF tarayici destegi.",
      filePath:
        "https://github.com/anilcetinkayaa/imlec-site/releases/download/v0.1.1-launcher/FIS260-0.1.1-windows-x64.zip",
      sha256: "9cbf2b96b51e1cec9b15835889911ffdc27b808855557504b9c800fcaa6e2e7c",
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
      throw new Error(`SEED_USER_EMAIL kullanicisi bulunamadi: ${seedUserEmail}`);
    }

    const fis260Product = await prisma.product.findUniqueOrThrow({
      where: {
        slug: "fis260",
      },
      select: {
        id: true,
      },
    });

    const existingEntitlement = await prisma.entitlement.findFirst({
      where: {
        userId: user.id,
        productId: fis260Product.id,
        source: "MANUAL",
      },
    });

    if (existingEntitlement) {
      await prisma.entitlement.update({
        where: {
          id: existingEntitlement.id,
        },
        data: {
          status: "ACTIVE",
          revokedAt: null,
          expiresAt: null,
        },
      });
    } else {
      await prisma.entitlement.create({
        data: {
          userId: user.id,
          productId: fis260Product.id,
          status: "ACTIVE",
          source: "MANUAL",
        },
      });
    }

    console.log(`Dev entitlement olusturuldu: ${user.email} -> FIS260`);
  }

  console.log("Product seed tamamlandi: launcher, FIS260, COZVER");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

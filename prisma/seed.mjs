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
      version: "0.1.7",
      minimumVersion: "0.1.4",
      releaseNotes:
        "Launcher arayuzu ve oturum yenileme akisi iyilestirildi; yeni imzali guncelleme paketi yayinlandi.",
      filePath:
        "https://github.com/anilcetinkayaa/imlec-site/releases/download/v0.1.1-launcher/ImlecLauncher-0.1.7-app-windows-x64.zip",
      sha256: "69e96ad702809a91ed85ba399fb7539d26b2b425c4afb7ad5ea8963a3dc79eff",
    });
  }

  if (fis260) {
    await upsertVersion(fis260, {
      version: "0.1.6",
      minimumVersion: "0.1.1",
      releaseNotes:
        "Performans iyilestirmeleri, OCR karar iyilestirmeleri ve kullanici arayuzu duzenlemeleri yayinlandi.",
      filePath:
        "https://github.com/anilcetinkayaa/imlec-site/releases/download/v0.1.1-launcher/FIS260-0.1.6-windows-x64.zip",
      sha256: "953991dfdddba564b611a9208f20d64df44feea2e40626223e9770c736da6620",
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

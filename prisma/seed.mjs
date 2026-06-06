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
      version: "0.1.2",
      minimumVersion: "0.1.1",
      releaseNotes:
        "Launcher guncellemesi. Cihaz dogrulama basliklari, DPAPI token saklama, duyuru karuseli ve self-update akisi.",
      filePath:
        "https://github.com/anilcetinkayaa/imlec-site/releases/download/v0.1.1-launcher/ImlecLauncher-0.1.2-windows-x64.zip",
      sha256: "bcf563a2e42cc40a2878883f7dc40f6a03aee4b491f20479b00be0c7eaae73f7",
    });
  }

  if (fis260) {
    await upsertVersion(fis260, {
      version: "0.1.1",
      minimumVersion: "0.1.0",
      releaseNotes:
        "FIS260 kullanici modu. Fis yukleme, OCR islemi, Excel aktarimi, masaustu lisans kontrolu ve guncelleme akisi.",
      filePath:
        "https://github.com/anilcetinkayaa/imlec-site/releases/download/v0.1.1-launcher/FIS260-0.1.1-windows-x64.zip",
      sha256: "72c008e9945e817dc3f3f829c341c857f4a9942a9ad625f5cea0b31a7db36f1e",
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

    await prisma.entitlement.upsert({
      where: {
        userId_productId: {
          userId: user.id,
          productId: fis260Product.id,
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
        productId: fis260Product.id,
        status: "ACTIVE",
        source: "MANUAL",
      },
    });

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

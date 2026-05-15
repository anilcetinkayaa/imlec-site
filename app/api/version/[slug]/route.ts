import { NextResponse } from "next/server";
import { prisma } from "@/src/db/prisma";

type VersionRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, context: VersionRouteContext) {
  const { slug: rawSlug } = await context.params;
  const slug = rawSlug.toLowerCase();

  const product = await prisma.product.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  if (!product) {
    return NextResponse.json(
      { ok: false, error: "PRODUCT_NOT_FOUND" },
      { status: 404 },
    );
  }

  const latestVersion = await prisma.productVersion.findFirst({
    where: {
      productId: product.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      version: true,
      minimumVersion: true,
      releaseNotes: true,
      sha256: true,
      createdAt: true,
    },
  });

  if (!latestVersion) {
    return NextResponse.json(
      { ok: false, error: "VERSION_NOT_FOUND" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    latest: latestVersion.version,
    minimum: latestVersion.minimumVersion ?? latestVersion.version,
    releaseNotes: latestVersion.releaseNotes ?? "",
    sha256: latestVersion.sha256,
    releasedAt: latestVersion.createdAt.toISOString(),
  });
}

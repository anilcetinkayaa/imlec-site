"use server";

import { AccessRequestStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/src/db/prisma";
import { sendAccessRequestNotification } from "@/src/server/access-request-email";
import {
  isEntitlementUsable,
  selectBestEntitlement,
} from "@/src/server/entitlement-helpers";

export async function requestFis260Access() {
  const session = await auth();
  const successPath = "/download?request=sent&product=fis260";

  if (!session?.user?.id || !session.user.email) {
    redirect("/login?callbackUrl=/download");
  }

  const product = await prisma.product.findUnique({
    where: {
      slug: "fis260",
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!product) {
    redirect("/download?request=failed&product=fis260");
  }

  const [entitlement, existingRequest] = await Promise.all([
    prisma.entitlement.findMany({
      where: {
        userId: session.user.id,
        productId: product.id,
      },
      select: {
        status: true,
        expiresAt: true,
        revokedAt: true,
      },
    }),
    prisma.accessRequest.findUnique({
      where: {
        userId_productCode: {
          userId: session.user.id,
          productCode: product.slug,
        },
      },
      select: {
        status: true,
      },
    }),
  ]);

  const bestEntitlement = selectBestEntitlement(entitlement);
  const hasAccess = bestEntitlement ? isEntitlementUsable(bestEntitlement) : false;

  if (hasAccess) {
    redirect("/download");
  }

  if (existingRequest?.status === AccessRequestStatus.PENDING) {
    redirect(successPath);
  }

  const accessRequest = await prisma.accessRequest.upsert({
    where: {
      userId_productCode: {
        userId: session.user.id,
        productCode: product.slug,
      },
    },
    update: {
      email: session.user.email,
      productId: product.id,
      status: AccessRequestStatus.PENDING,
      reviewedAt: null,
      reviewedById: null,
    },
    create: {
      userId: session.user.id,
      email: session.user.email,
      productCode: product.slug,
      productId: product.id,
      status: AccessRequestStatus.PENDING,
    },
  });

  await sendAccessRequestNotification({
    email: session.user.email,
    productName: product.name,
    requestedAt: accessRequest.updatedAt,
  });

  redirect(successPath);
}

export async function requestFis260AccessFromMembershipPage() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    redirect("/login?callbackUrl=/uyelik");
  }

  const product = await prisma.product.findUnique({
    where: {
      slug: "fis260",
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!product) {
    redirect("/uyelik?request=failed&product=fis260");
  }

  const [entitlement, existingRequest] = await Promise.all([
    prisma.entitlement.findMany({
      where: {
        userId: session.user.id,
        productId: product.id,
      },
      select: {
        status: true,
        expiresAt: true,
        revokedAt: true,
      },
    }),
    prisma.accessRequest.findUnique({
      where: {
        userId_productCode: {
          userId: session.user.id,
          productCode: product.slug,
        },
      },
      select: {
        status: true,
      },
    }),
  ]);

  const bestEntitlement = selectBestEntitlement(entitlement);
  const hasAccess = bestEntitlement ? isEntitlementUsable(bestEntitlement) : false;

  if (hasAccess) {
    redirect("/download");
  }

  if (existingRequest?.status === AccessRequestStatus.PENDING) {
    redirect("/uyelik?request=sent&product=fis260");
  }

  const accessRequest = await prisma.accessRequest.upsert({
    where: {
      userId_productCode: {
        userId: session.user.id,
        productCode: product.slug,
      },
    },
    update: {
      email: session.user.email,
      productId: product.id,
      status: AccessRequestStatus.PENDING,
      reviewedAt: null,
      reviewedById: null,
    },
    create: {
      userId: session.user.id,
      email: session.user.email,
      productCode: product.slug,
      productId: product.id,
      status: AccessRequestStatus.PENDING,
    },
  });

  await sendAccessRequestNotification({
    email: session.user.email,
    productName: product.name,
    requestedAt: accessRequest.updatedAt,
  });

  redirect("/uyelik?request=sent&product=fis260");
}

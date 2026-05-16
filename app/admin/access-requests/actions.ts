"use server";

import {
  AccessRequestStatus,
  EntitlementSource,
  EntitlementStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/src/db/prisma";
import { sendAccessApprovedEmail } from "@/src/server/access-request-email";
import {
  requireAdminSession,
  toJsonValue,
} from "@/src/server/admin-action-log";

export async function approveAccessRequest(formData: FormData) {
  const admin = await requireAdminSession();

  if (admin.error) {
    return;
  }

  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const before = await tx.accessRequest.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!before || before.status !== AccessRequestStatus.PENDING) {
      return null;
    }

    const product =
      before.product ??
      (await tx.product.findUnique({
        where: {
          slug: before.productCode,
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      }));

    if (!product) {
      return null;
    }

    const entitlement = await tx.entitlement.upsert({
      where: {
        userId_productId: {
          userId: before.userId,
          productId: product.id,
        },
      },
      update: {
        status: EntitlementStatus.ACTIVE,
        source: EntitlementSource.MANUAL,
        startsAt: new Date(),
        expiresAt: null,
        revokedAt: null,
      },
      create: {
        userId: before.userId,
        productId: product.id,
        status: EntitlementStatus.ACTIVE,
        source: EntitlementSource.MANUAL,
        startsAt: new Date(),
        expiresAt: null,
        revokedAt: null,
      },
    });

    const after = await tx.accessRequest.update({
      where: { id },
      data: {
        status: AccessRequestStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedById: admin.session.user.id,
        productId: product.id,
      },
    });

    await tx.adminActionLog.create({
      data: {
        adminId: admin.session.user.id,
        targetUserId: before.userId,
        action: "ACCESS_REQUEST_APPROVE",
        before: toJsonValue(before),
        after: toJsonValue({
          accessRequest: after,
          entitlement,
        }),
        ipAddress: null,
      },
    });

    return {
      email: before.email,
      productName: product.name,
    };
  });

  if (result) {
    await sendAccessApprovedEmail(result);
  }

  revalidatePath("/admin");
}

export async function rejectAccessRequest(formData: FormData) {
  const admin = await requireAdminSession();

  if (admin.error) {
    return;
  }

  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const before = await tx.accessRequest.findUnique({
      where: { id },
    });

    if (!before || before.status !== AccessRequestStatus.PENDING) {
      return;
    }

    const after = await tx.accessRequest.update({
      where: { id },
      data: {
        status: AccessRequestStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedById: admin.session.user.id,
      },
    });

    await tx.adminActionLog.create({
      data: {
        adminId: admin.session.user.id,
        targetUserId: before.userId,
        action: "ACCESS_REQUEST_REJECT",
        before: toJsonValue(before),
        after: toJsonValue(after),
        ipAddress: null,
      },
    });
  });

  revalidatePath("/admin");
}

"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/src/db/prisma";
import { normalizeEmail, hashPassword } from "@/src/server/auth/password";
import {
  requireAdminSession,
  toJsonValue,
} from "@/src/server/admin-action-log";

const roles = new Set(Object.values(UserRole));

function cleanText(value: FormDataEntryValue | null, max = 160) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, max) : null;
}

function cleanPassword(value: FormDataEntryValue | null) {
  const password = String(value ?? "");
  return password.length >= 8 ? password : null;
}

async function requireOwner() {
  const admin = await requireAdminSession({ write: true });

  if (admin.error || admin.session.user.role !== UserRole.OWNER) {
    return null;
  }

  return admin.session.user;
}

export async function createStaffUser(formData: FormData) {
  const owner = await requireOwner();

  if (!owner) {
    return;
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const name = cleanText(formData.get("name"));
  const staffTitle = cleanText(formData.get("staffTitle"));
  const password = cleanPassword(formData.get("password"));
  const rawRole = String(formData.get("role") ?? UserRole.SUPPORT);
  const role = roles.has(rawRole as UserRole) ? (rawRole as UserRole) : UserRole.SUPPORT;

  if (!email || !password) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email } });
    const passwordHash = await hashPassword(password);
    const user = existing
      ? await tx.user.update({
          where: { id: existing.id },
          data: { name, staffTitle, role, passwordHash, disabledAt: null },
        })
      : await tx.user.create({
          data: { email, name, staffTitle, role, passwordHash },
        });

    await tx.adminActionLog.create({
      data: {
        adminId: owner.id,
        targetUserId: user.id,
        action: existing ? "STAFF_USER_UPDATE_ON_CREATE" : "STAFF_USER_CREATE",
        before: toJsonValue(existing),
        after: toJsonValue({ id: user.id, email, name, staffTitle, role }),
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/users");
}

export async function updateUserRoleAndTitle(formData: FormData) {
  const owner = await requireOwner();

  if (!owner) {
    return;
  }

  const userId = String(formData.get("userId") ?? "");
  const rawRole = String(formData.get("role") ?? "");
  const staffTitle = cleanText(formData.get("staffTitle"));

  if (!userId || !roles.has(rawRole as UserRole)) {
    return;
  }

  if (userId === owner.id && rawRole !== UserRole.OWNER) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({ where: { id: userId } });

    if (!before) {
      return;
    }

    const after = await tx.user.update({
      where: { id: userId },
      data: {
        role: rawRole as UserRole,
        staffTitle,
      },
    });

    await tx.adminActionLog.create({
      data: {
        adminId: owner.id,
        targetUserId: userId,
        action: "USER_ROLE_TITLE_UPDATE",
        before: toJsonValue({
          role: before.role,
          staffTitle: before.staffTitle,
        }),
        after: toJsonValue({
          role: after.role,
          staffTitle: after.staffTitle,
        }),
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function resetUserPassword(formData: FormData) {
  const owner = await requireOwner();

  if (!owner) {
    return;
  }

  const userId = String(formData.get("userId") ?? "");
  const password = cleanPassword(formData.get("password"));

  if (!userId || !password) {
    return;
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!before) {
      return;
    }

    await tx.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await tx.adminActionLog.create({
      data: {
        adminId: owner.id,
        targetUserId: userId,
        action: "USER_PASSWORD_RESET",
        before: toJsonValue({ email: before.email }),
        after: toJsonValue({ resetByOwner: true }),
      },
    });
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

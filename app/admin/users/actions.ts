"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  ALL_ADMIN_PERMISSION_KEYS,
  generateTemporaryPassword,
  makeStaffUsername,
  normalizeStaffUsername,
} from "@/src/server/admin-permissions";
import { prisma } from "@/src/db/prisma";
import { normalizeEmail, hashPassword } from "@/src/server/auth/password";
import {
  requireAdminSession,
  toJsonValue,
} from "@/src/server/admin-action-log";

function cleanText(value: FormDataEntryValue | null, max = 160) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, max) : null;
}

function selectedPermissions(formData: FormData) {
  const selected = new Set(
    formData.getAll("permissions").map((value) => String(value)),
  );
  return ALL_ADMIN_PERMISSION_KEYS.filter((permission) =>
    selected.has(permission),
  );
}

async function requireStaffManager() {
  const admin = await requireAdminSession({ write: true });

  if (admin.error) {
    return null;
  }

  if (
    admin.session.user.role !== UserRole.OWNER &&
    admin.session.user.role !== UserRole.ADMIN
  ) {
    return null;
  }

  return admin.session.user;
}

export type StaffCreateState = {
  ok?: boolean;
  message?: string;
  username?: string;
  temporaryPassword?: string;
};

export async function createStaffUser(
  _previousState: StaffCreateState,
  formData: FormData,
): Promise<StaffCreateState> {
  const admin = await requireStaffManager();

  if (!admin) {
    return { ok: false, message: "Bu islem icin yetkiniz yok." };
  }

  const name = cleanText(formData.get("name"));
  const requestedUsername = cleanText(formData.get("username"));
  const username = normalizeStaffUsername(
    requestedUsername || (name ? makeStaffUsername(name) : ""),
  );
  const emailText = cleanText(formData.get("email"));
  const email = emailText ? normalizeEmail(emailText) : null;
  const staffTitle = cleanText(formData.get("staffTitle"));
  const permissions = selectedPermissions(formData);
  const temporaryPassword = generateTemporaryPassword();

  if (!username || username.length < 3) {
    return {
      ok: false,
      message: "Kullanici adi en az 3 karakter olmali. Ornek: GVARDARLI.",
    };
  }

  if (!name) {
    return { ok: false, message: "Ad soyad zorunlu." };
  }

  const passwordHash = await hashPassword(temporaryPassword);

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findFirst({
      where: {
        OR: [
          { username },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existing) {
      return { duplicate: true };
    }

    const user = await tx.user.create({
      data: {
        email: email ?? `${username.toLowerCase()}@staff.imlecyazilim.local`,
        username,
        name,
        staffTitle,
        role: UserRole.SUPPORT,
        staffPermissions: permissions,
        passwordHash,
      },
    });

    await tx.adminActionLog.create({
      data: {
        adminId: admin.id,
        targetUserId: user.id,
        action: "STAFF_ACCOUNT_CREATE",
        before: toJsonValue(null),
        after: toJsonValue({
          id: user.id,
          username,
          email: user.email,
          name,
          staffTitle,
          role: UserRole.SUPPORT,
          staffPermissions: permissions,
        }),
      },
    });

    return { duplicate: false };
  });

  if (result.duplicate) {
    return {
      ok: false,
      message: "Bu kullanici adi veya email zaten kayitli.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");

  return {
    ok: true,
    message: "Personel hesabi olusturuldu. Gecici sifreyi personele iletin.",
    username,
    temporaryPassword,
  };
}

export async function updateStaffPermissions(formData: FormData) {
  const admin = await requireStaffManager();

  if (!admin) {
    return;
  }

  const userId = String(formData.get("userId") ?? "");
  const staffTitle = cleanText(formData.get("staffTitle"));
  const permissions = selectedPermissions(formData);

  if (!userId) {
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
        role:
          before.role === UserRole.OWNER || before.role === UserRole.ADMIN
            ? before.role
            : UserRole.SUPPORT,
        staffTitle,
        staffPermissions: permissions,
      },
    });

    await tx.adminActionLog.create({
      data: {
        adminId: admin.id,
        targetUserId: userId,
        action: "STAFF_PERMISSIONS_UPDATE",
        before: toJsonValue({
          staffTitle: before.staffTitle,
          staffPermissions: before.staffPermissions,
        }),
        after: toJsonValue({
          staffTitle: after.staffTitle,
          staffPermissions: after.staffPermissions,
        }),
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function resetUserPassword(formData: FormData) {
  const admin = await requireStaffManager();

  if (!admin) {
    return;
  }

  const userId = String(formData.get("userId") ?? "");
  const password = cleanText(formData.get("password"), 80);

  if (!userId || !password || password.length < 8) {
    return;
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true },
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
        adminId: admin.id,
        targetUserId: userId,
        action: "USER_PASSWORD_RESET",
        before: toJsonValue({ email: before.email, username: before.username }),
        after: toJsonValue({ resetByAdmin: true }),
      },
    });
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

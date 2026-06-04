import { UserRole } from "@prisma/client";
import { auth } from "@/auth";

const ADMIN_PANEL_ROLES = new Set<UserRole>([
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.SUPPORT,
]);

const ADMIN_WRITE_ROLES = new Set<UserRole>([
  UserRole.OWNER,
  UserRole.ADMIN,
]);

export async function getAdminSession() {
  const session = await auth();

  if (!session?.user) {
    return { status: "unauthenticated" as const };
  }

  if (!ADMIN_PANEL_ROLES.has(session.user.role)) {
    return { status: "forbidden" as const };
  }

  return { status: "authorized" as const, session };
}

export function canWriteAdmin(role: UserRole) {
  return ADMIN_WRITE_ROLES.has(role);
}

export async function requireAdminApi(options?: { write?: boolean }) {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    return Response.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  if (admin.status === "forbidden") {
    return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  if (options?.write && !canWriteAdmin(admin.session.user.role)) {
    return Response.json({ ok: false, error: "WRITE_FORBIDDEN" }, { status: 403 });
  }

  return null;
}

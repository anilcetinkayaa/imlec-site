import { UserRole } from "@prisma/client";
import { auth } from "@/auth";

export async function getAdminSession() {
  const session = await auth();

  if (!session?.user) {
    return { status: "unauthenticated" as const };
  }

  if (session.user.role !== UserRole.ADMIN) {
    return { status: "forbidden" as const };
  }

  return { status: "authorized" as const, session };
}

export async function requireAdminApi() {
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

  return null;
}

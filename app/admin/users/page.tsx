import { UserRole } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { roleLabel } from "@/src/server/admin-permissions";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/ui";
import { AdminActionLogList } from "@/components/admin/AdminActionLogList";
import {
  ADMIN_ACTION_CATEGORIES,
  getActionsForCategory,
} from "@/src/server/admin-action-presenter";
import { StaffCreateForm } from "./staff-create-form";

export const metadata: Metadata = {
  title: "Personel Yetkileri | İmleç Admin",
};

type AdminUsersPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    staff?: string;
    page?: string;
  }>;
};

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/users");
  }

  if (admin.status === "forbidden") {
    redirect("/admin");
  }

  const canManageStaff =
    admin.session.user.role === UserRole.OWNER ||
    admin.session.user.role === UserRole.ADMIN;
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category?.trim() ?? "";
  const selectedStaffId = params.staff?.trim() ?? "";
  const page = Math.max(Number.parseInt(params.page ?? "1", 10) || 1, 1);
  const pageSize = 40;
  const categoryActions = getActionsForCategory(category);

  const staffUsers = await prisma.user.findMany({
    where: {
      OR: [
        { role: { in: [UserRole.OWNER, UserRole.ADMIN, UserRole.SUPPORT] } },
        { username: { not: null } },
      ],
    },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    take: 120,
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      staffTitle: true,
      staffPermissions: true,
      role: true,
      disabledAt: true,
    },
  });

  const matchingPeople = query
    ? await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { username: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
        select: { id: true },
        take: 100,
      })
    : [];
  const matchingPersonIds = matchingPeople.map((person) => person.id);
  const actionWhere = {
    ...(selectedStaffId ? { adminId: selectedStaffId } : {}),
    ...(categoryActions.length > 0 ? { action: { in: categoryActions } } : {}),
    ...(query
      ? {
          OR: [
            { action: { contains: query, mode: "insensitive" as const } },
            ...(matchingPersonIds.length > 0
              ? [
                  { adminId: { in: matchingPersonIds } },
                  { targetUserId: { in: matchingPersonIds } },
                ]
              : []),
          ],
        }
      : {}),
  };

  const [recentActions, actionCount] = await Promise.all([
    prisma.adminActionLog.findMany({
      where: actionWhere,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        adminId: true,
        targetUserId: true,
        action: true,
        before: true,
        after: true,
        ipAddress: true,
        createdAt: true,
      },
    }),
    prisma.adminActionLog.count({ where: actionWhere }),
  ]);

  const actorIds = [
    ...new Set(
      recentActions
        .flatMap((action) => [action.adminId, action.targetUserId])
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true, username: true, email: true },
      })
    : [];
  const actorMap = new Map(
    actors.map((actor) => [
      actor.id,
      actor.name ?? actor.username ?? actor.email,
    ]),
  );
  const totalPages = Math.max(Math.ceil(actionCount / pageSize), 1);

  function logPageHref(nextPage: number) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (category) search.set("category", category);
    if (selectedStaffId) search.set("staff", selectedStaffId);
    search.set("page", String(nextPage));
    return `/admin/users?${search.toString()}#personel-islemleri`;
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <AdminPageHeader
          eyebrow="Personel ve yetki yönetimi"
          title="Personel Hesapları"
          lead="Müşteri hesaplarını admin yapmak yerine ekibiniz için ayrı personel hesabı oluşturun. Her personele yalnızca gerekli ekranları verin; yaptığı işlemler loglarda saklanır."
        />

        {canManageStaff ? (
          <StaffCreateForm />
        ) : (
          <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--warning)]/20 bg-[var(--warning)]/[0.06] p-5 text-sm text-[var(--text-secondary)]">
            Personel hesabı ve yetki tanımlama yalnızca Firma Sahibi
            yetkisindeki hesaplar tarafından yapılır.
          </div>
        )}

        <AdminPanel className="mt-6" eyebrow="Ekip" title="Personel listesi">
          <div className="mt-4 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
            <div className="grid min-w-[780px] grid-cols-[1.5fr_1fr_1fr_0.7fr_1.1fr] bg-white/[0.035] px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              <span>Ad / E-posta</span>
              <span>Kullanıcı adı</span>
              <span>Görev / Rol</span>
              <span>Yetki</span>
              <span>İşlem</span>
            </div>
            {staffUsers.length > 0 ? (
              staffUsers.map((user) => {
                const isPrivileged =
                  user.role === UserRole.OWNER || user.role === UserRole.ADMIN;

                return (
                  <div
                    key={user.id}
                    className="grid min-w-[780px] grid-cols-[1.5fr_1fr_1fr_0.7fr_1.1fr] items-center border-t border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-secondary)] transition hover:bg-white/[0.02]"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium text-[var(--text-primary)]">
                          {user.name ?? user.email}
                        </span>
                        {user.disabledAt ? (
                          <span className="shrink-0 rounded-full border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--danger)]">
                            Devre dışı
                          </span>
                        ) : null}
                      </span>
                      <span className="block truncate text-xs text-[var(--text-tertiary)]">
                        {user.email}
                      </span>
                    </span>
                    <span className="truncate font-mono text-xs">
                      {user.username ?? "-"}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[var(--text-primary)]">
                        {user.staffTitle ?? "Unvan tanımlı değil"}
                      </span>
                      <span
                        className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] ${
                          isPrivileged
                            ? "border-[var(--accent-brand)]/25 bg-[var(--accent-brand)]/10 text-[var(--accent-brand)]"
                            : "border-[var(--border-default)] bg-white/[0.03] text-[var(--text-secondary)]"
                        }`}
                      >
                        {roleLabel(user.role)}
                      </span>
                    </span>
                    <span className="font-mono text-xs">
                      {isPrivileged ? "Tümü" : `${user.staffPermissions.length} ekran`}
                    </span>
                    <span className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-[var(--accent-brand)] transition hover:brightness-110"
                      >
                        Yetkiler
                      </Link>
                      <Link
                        href={`/admin/users/${user.id}/activity`}
                        className="text-[var(--success)] transition hover:brightness-110"
                      >
                        İşlemler
                      </Link>
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="border-t border-[var(--border-subtle)] p-4">
                <AdminEmptyState>Henüz personel hesabı yok.</AdminEmptyState>
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">
            Yetki düzenleme ile personelin sistemde yaptığı işlemler ayrı
            ekranlarda gösterilir.
          </p>
        </AdminPanel>

        <AdminPanel
          id="personel-islemleri"
          className="mt-6"
          eyebrow="Denetim"
          title="Personel işlem geçmişi"
        >
          <form
            method="get"
            className="mt-4 grid gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-0)]/60 p-3 md:grid-cols-[1fr_0.8fr_0.8fr_auto]"
          >
            <input
              name="q"
              defaultValue={query}
              placeholder="İşlem, personel veya kullanıcı ara"
              className="h-10 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-brand)]/60"
            />
            <select
              name="staff"
              defaultValue={selectedStaffId}
              className="h-10 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 text-sm text-[var(--text-primary)] outline-none"
            >
              <option value="">Tüm personel</option>
              {staffUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name ?? user.username ?? user.email}
                </option>
              ))}
            </select>
            <select
              name="category"
              defaultValue={category}
              className="h-10 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 text-sm text-[var(--text-primary)] outline-none"
            >
              <option value="">Tüm işlem türleri</option>
              {ADMIN_ACTION_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button className="h-10 rounded-[var(--radius-sm)] bg-[var(--accent-brand)] px-4 text-sm font-medium text-[oklch(0.15_0.04_250)]">
              Filtrele
            </button>
          </form>

          <div className="mt-4">
            <AdminActionLogList logs={recentActions} people={actorMap} />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[var(--text-tertiary)]">
            <span>
              {actionCount} işlem · Sayfa {page}/{totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link
                  href={logPageHref(page - 1)}
                  className="rounded-[var(--radius-sm)] border border-[var(--border-default)] px-3 py-2 text-[var(--text-secondary)]"
                >
                  Önceki
                </Link>
              ) : null}
              {page < totalPages ? (
                <Link
                  href={logPageHref(page + 1)}
                  className="rounded-[var(--radius-sm)] border border-[var(--border-default)] px-3 py-2 text-[var(--text-secondary)]"
                >
                  Sonraki
                </Link>
              ) : null}
            </div>
          </div>
        </AdminPanel>
      </div>
    </main>
  );
}

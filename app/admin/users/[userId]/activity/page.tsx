import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AdminActionLogList } from "@/components/admin/AdminActionLogList";
import {
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/ui";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";
import {
  ADMIN_ACTION_CATEGORIES,
  getActionsForCategory,
} from "@/src/server/admin-action-presenter";

type StaffActivityPageProps = {
  params: Promise<{
    userId: string;
  }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
  }>;
};

export default async function StaffActivityPage({
  params,
  searchParams,
}: StaffActivityPageProps) {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/users");
  }

  if (admin.status === "forbidden") {
    redirect("/admin");
  }

  const [{ userId }, filters] = await Promise.all([params, searchParams]);
  const query = filters.q?.trim() ?? "";
  const category = filters.category?.trim() ?? "";
  const page = Math.max(Number.parseInt(filters.page ?? "1", 10) || 1, 1);
  const pageSize = 50;
  const categoryActions = getActionsForCategory(category);

  const staff = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      staffTitle: true,
    },
  });

  if (!staff) {
    notFound();
  }

  const staffId = staff.id;
  const matchingTargets = query
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
  const matchingTargetIds = matchingTargets.map((target) => target.id);
  const where = {
    adminId: staffId,
    ...(categoryActions.length > 0 ? { action: { in: categoryActions } } : {}),
    ...(query
      ? {
          OR: [
            { action: { contains: query, mode: "insensitive" as const } },
            ...(matchingTargetIds.length > 0
              ? [{ targetUserId: { in: matchingTargetIds } }]
              : []),
          ],
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.adminActionLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.adminActionLog.count({ where }),
  ]);
  const personIds = [
    ...new Set(
      logs
        .flatMap((log) => [log.adminId, log.targetUserId])
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const people = personIds.length
    ? await prisma.user.findMany({
        where: { id: { in: personIds } },
        select: { id: true, name: true, username: true, email: true },
      })
    : [];
  const peopleMap = new Map(
    people.map((person) => [
      person.id,
      person.name ?? person.username ?? person.email,
    ]),
  );
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  function pageHref(nextPage: number) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (category) search.set("category", category);
    search.set("page", String(nextPage));
    return `/admin/users/${staffId}/activity?${search.toString()}`;
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <AdminPageHeader
          eyebrow="Personel denetimi"
          title={staff.name ?? staff.username ?? staff.email}
          lead={`${staff.staffTitle ?? "Personel"} hesabının sistemde yaptığı değişiklikler. Müşteri hesabı ayrıntıları bu ekranda gösterilmez.`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/users/${staffId}`}
                className="rounded-[var(--radius-sm)] border border-[var(--border-default)] px-3 py-2 text-sm text-[var(--text-secondary)]"
              >
                Yetkileri yönet
              </Link>
              <Link
                href="/admin/users"
                className="rounded-[var(--radius-sm)] border border-[var(--border-default)] px-3 py-2 text-sm text-[var(--text-secondary)]"
              >
                Personel listesi
              </Link>
            </div>
          }
        />

        <AdminPanel className="mt-6" eyebrow="Faaliyet" title="İşlem geçmişi">
          <form
            method="get"
            className="mt-4 grid gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-0)]/60 p-3 md:grid-cols-[1fr_0.8fr_auto]"
          >
            <input
              name="q"
              defaultValue={query}
              placeholder="İşlem veya hedef kullanıcı ara"
              className="h-10 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
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
            <AdminActionLogList logs={logs} people={peopleMap} />
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
            <span>
              {total} işlem · Sayfa {page}/{totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link
                  href={pageHref(page - 1)}
                  className="rounded-[var(--radius-sm)] border border-[var(--border-default)] px-3 py-2"
                >
                  Önceki
                </Link>
              ) : null}
              {page < totalPages ? (
                <Link
                  href={pageHref(page + 1)}
                  className="rounded-[var(--radius-sm)] border border-[var(--border-default)] px-3 py-2"
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

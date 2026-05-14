import { AnnouncementType } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";

export const metadata: Metadata = {
  title: "Duyurular | İmleç Yazılım Admin",
  description: "Desktop ve web duyurularını yönetin.",
};

function formatDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDateTimeInput(date: Date | null) {
  if (!date) {
    return "";
  }

  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function ForbiddenView() {
  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-3xl rounded-xl border border-white/[0.08] bg-white/[0.025] p-6">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-red-300">
          Erişim reddedildi
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Bu alan yalnızca ADMIN rolü içindir.
        </h1>
      </div>
    </main>
  );
}

function TypeSelect({
  defaultValue,
  id,
}: {
  defaultValue?: AnnouncementType;
  id: string;
}) {
  return (
    <select
      id={id}
      name="type"
      defaultValue={defaultValue ?? AnnouncementType.BILGILENDIRME}
      className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none focus:border-blue-300/50"
    >
      {Object.values(AnnouncementType).map((type) => (
        <option key={type} value={type}>
          {type}
        </option>
      ))}
    </select>
  );
}

export default async function AdminAnnouncementsPage() {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/announcements");
  }

  if (admin.status === "forbidden") {
    return <ForbiddenView />;
  }

  const announcements = await prisma.announcement.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              ← Kullanıcılar
            </Link>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.24em] text-blue-300/80">
              Admin panel
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Duyurular / Yayınlar
            </h1>
          </div>
          <Link
            href="/account"
            className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05]"
          >
            Üyelik paneli
          </Link>
        </div>

        <section className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
          <h2 className="text-xl font-semibold tracking-tight">Yeni duyuru</h2>
          <form
            action="/api/admin/announcements/create"
            method="post"
            className="mt-4 grid gap-4 lg:grid-cols-2"
          >
            <label className="grid gap-2 text-sm text-zinc-400">
              Başlık
              <input
                name="title"
                required
                className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-blue-300/50"
              />
            </label>
            <label className="grid gap-2 text-sm text-zinc-400">
              Tür
              <TypeSelect id="create-type" />
            </label>
            <label className="grid gap-2 text-sm text-zinc-400">
              Başlangıç
              <input
                name="startsAt"
                type="datetime-local"
                className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none focus:border-blue-300/50"
              />
            </label>
            <label className="grid gap-2 text-sm text-zinc-400">
              Bitiş
              <input
                name="endsAt"
                type="datetime-local"
                className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none focus:border-blue-300/50"
              />
            </label>
            <label className="grid gap-2 text-sm text-zinc-400 lg:col-span-2">
              İçerik
              <textarea
                name="body"
                required
                rows={5}
                className="rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-blue-300/50"
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
                <input
                  name="isPublished"
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/[0.2] bg-[#0c0d10]"
                />
                Yayında
              </label>
              <button className="h-11 rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-950 transition hover:bg-white">
                Duyuru ekle
              </button>
            </div>
          </form>
        </section>

        <section className="mt-6 overflow-hidden rounded-xl border border-white/[0.08]">
          <div className="grid grid-cols-[1.5fr_0.9fr_0.7fr_1fr_1fr_1fr] bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
            <span>Başlık</span>
            <span>Tür</span>
            <span>Yayın</span>
            <span>Başlangıç</span>
            <span>Bitiş</span>
            <span>Oluşturma</span>
          </div>

          {announcements.length > 0 ? (
            announcements.map((announcement) => (
              <details
                key={announcement.id}
                className="border-t border-white/[0.07] px-4 py-3"
              >
                <summary className="grid cursor-pointer grid-cols-[1.5fr_0.9fr_0.7fr_1fr_1fr_1fr] text-sm text-zinc-300">
                  <span className="truncate text-white">
                    {announcement.title}
                  </span>
                  <span>{announcement.type}</span>
                  <span>{announcement.isPublished ? "Evet" : "Hayır"}</span>
                  <span>{formatDate(announcement.startsAt)}</span>
                  <span>{formatDate(announcement.endsAt)}</span>
                  <span>{formatDate(announcement.createdAt)}</span>
                </summary>

                <form
                  action="/api/admin/announcements/update"
                  method="post"
                  className="mt-4 grid gap-4 rounded-lg border border-white/[0.07] bg-black/20 p-4 lg:grid-cols-2"
                >
                  <input type="hidden" name="id" value={announcement.id} />
                  <label className="grid gap-2 text-sm text-zinc-400">
                    Başlık
                    <input
                      name="title"
                      required
                      defaultValue={announcement.title}
                      className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none focus:border-blue-300/50"
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-zinc-400">
                    Tür
                    <TypeSelect
                      id={`type-${announcement.id}`}
                      defaultValue={announcement.type}
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-zinc-400">
                    Başlangıç
                    <input
                      name="startsAt"
                      type="datetime-local"
                      defaultValue={formatDateTimeInput(announcement.startsAt)}
                      className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none focus:border-blue-300/50"
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-zinc-400">
                    Bitiş
                    <input
                      name="endsAt"
                      type="datetime-local"
                      defaultValue={formatDateTimeInput(announcement.endsAt)}
                      className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none focus:border-blue-300/50"
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-zinc-400 lg:col-span-2">
                    İçerik
                    <textarea
                      name="body"
                      required
                      rows={4}
                      defaultValue={announcement.body}
                      className="rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 py-3 text-sm text-white outline-none focus:border-blue-300/50"
                    />
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:col-span-2">
                    <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
                      <input
                        name="isPublished"
                        type="checkbox"
                        defaultChecked={announcement.isPublished}
                        className="h-4 w-4 rounded border-white/[0.2] bg-[#0c0d10]"
                      />
                      Yayında
                    </label>
                    <div className="flex gap-3">
                      <button className="h-10 rounded-lg bg-zinc-100 px-4 text-sm font-medium text-zinc-950 transition hover:bg-white">
                        Kaydet
                      </button>
                    </div>
                  </div>
                </form>
                <form
                  action="/api/admin/announcements/delete"
                  method="post"
                  className="mt-3"
                >
                  <input type="hidden" name="id" value={announcement.id} />
                  <button className="rounded-lg border border-red-400/30 px-4 py-2 text-sm text-red-200 transition hover:bg-red-400/10">
                    Sil
                  </button>
                </form>
              </details>
            ))
          ) : (
            <div className="border-t border-white/[0.07] px-4 py-5 text-sm text-zinc-500">
              Duyuru bulunamadı.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

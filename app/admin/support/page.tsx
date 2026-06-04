import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";

export const metadata: Metadata = {
  title: "Destek Bildirimleri | İmleç Admin",
  description: "FIS260 içinden gönderilen fiş hata bildirimlerini inceleyin.",
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

export default async function AdminSupportPage() {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/support");
  }

  if (admin.status === "forbidden") {
    redirect("/admin");
  }

  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      user: {
        select: { email: true, name: true },
      },
      attachments: {
        select: { id: true, kind: true },
      },
    },
  });

  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-red-300/80">
              Hata geri bildirimi
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Destek Bildirimleri
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Kullanıcıların FIS260 içinden gönderdiği fiş görseli, sürüm,
              açıklama ve sistem çıktısı burada toplanır.
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05]"
          >
            Admin ana sayfa
          </Link>
        </div>

        <section className="mt-6 overflow-hidden rounded-xl border border-white/[0.08]">
          <div className="grid grid-cols-[1fr_1.2fr_0.7fr_0.9fr_1.2fr_0.7fr_0.7fr] bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
            <span>Tarih</span>
            <span>Kullanıcı</span>
            <span>Sürüm</span>
            <span>Tip</span>
            <span>Fiş</span>
            <span>Durum</span>
            <span>Detay</span>
          </div>
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="grid grid-cols-[1fr_1.2fr_0.7fr_0.9fr_1.2fr_0.7fr_0.7fr] border-t border-white/[0.07] px-4 py-3 text-sm text-zinc-300"
              >
                <span>{formatDate(ticket.createdAt)}</span>
                <span className="truncate text-white">
                  {ticket.user.email}
                </span>
                <span className="font-mono">{ticket.appVersion ?? "-"}</span>
                <span>{ticket.issueType}</span>
                <span className="truncate">{ticket.sourceFileName ?? "-"}</span>
                <span>{ticket.status}</span>
                <Link
                  href={`/admin/support/${ticket.id}`}
                  className="text-red-300 transition hover:text-red-200"
                >
                  Aç
                </Link>
              </div>
            ))
          ) : (
            <div className="border-t border-white/[0.07] px-4 py-5 text-sm text-zinc-500">
              Henüz destek bildirimi yok.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

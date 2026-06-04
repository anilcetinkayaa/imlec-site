import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";

export const metadata: Metadata = {
  title: "Destek Bildirimi | İmleç Admin",
};

type AdminSupportDetailPageProps = {
  params: Promise<{
    ticketId: string;
  }>;
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

function prettyJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

export default async function AdminSupportDetailPage({
  params,
}: AdminSupportDetailPageProps) {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/support");
  }

  if (admin.status === "forbidden") {
    redirect("/admin");
  }

  const { ticketId } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: { email: true, name: true },
      },
      attachments: {
        select: {
          id: true,
          kind: true,
          fileName: true,
          contentType: true,
          sizeBytes: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  const receiptImage = ticket.attachments.find((item) => item.kind === "receipt_image");
  const resultJson = ticket.attachments.find((item) => item.kind === "result_json");

  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-red-300/80">
              {ticket.status}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              {ticket.issueType}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              {ticket.user.email} · Sürüm {ticket.appVersion ?? "-"} ·{" "}
              {formatDate(ticket.createdAt)}
            </p>
          </div>
          <Link
            href="/admin/support"
            className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05]"
          >
            Listeye dön
          </Link>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <h2 className="text-2xl font-semibold tracking-tight">Fiş görseli</h2>
            {receiptImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/admin/support/attachments/${receiptImage.id}`}
                alt={receiptImage.fileName}
                className="mt-4 max-h-[760px] w-full rounded-lg border border-white/[0.08] object-contain"
              />
            ) : (
              <p className="mt-4 text-sm text-zinc-500">Fiş görseli yok.</p>
            )}
          </section>

          <section className="grid gap-6">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
              <h2 className="text-2xl font-semibold tracking-tight">
                Müşteri notu
              </h2>
              <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-300">
                {ticket.message}
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
              <h2 className="text-2xl font-semibold tracking-tight">
                Sistem özeti
              </h2>
              <pre className="mt-4 max-h-[360px] overflow-auto rounded-lg border border-white/[0.07] bg-[#0c0d10] p-4 text-xs text-zinc-300">
                {prettyJson(ticket.systemSummary)}
              </pre>
            </div>

            <form
              action="/api/admin/support/update"
              method="post"
              className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5"
            >
              <input type="hidden" name="ticketId" value={ticket.id} />
              <h2 className="text-2xl font-semibold tracking-tight">
                Durum ve müşteri notu
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Buraya yazdığın durum ve not, müşterinin FIS260 içindeki Sorun Takibi ekranında görünür.
              </p>
              <label className="mt-4 block text-sm text-zinc-400" htmlFor="status">
                Durum
              </label>
              <select
                id="status"
                name="status"
                defaultValue={ticket.status}
                className="mt-2 w-full rounded-lg border border-white/[0.12] bg-[#0c0d10] px-3 py-2 text-sm text-zinc-100"
              >
                <option value="OPEN">İletildi</option>
                <option value="IN_REVIEW">Kontrol ediliyor</option>
                <option value="FIXED">Çözüldü</option>
                <option value="RELEASED">Güncellendi</option>
                <option value="CLOSED">Kapatıldı</option>
              </select>
              <label className="mt-4 block text-sm text-zinc-400" htmlFor="adminNote">
                Müşteriye görünecek not
              </label>
              <textarea
                id="adminNote"
                name="adminNote"
                defaultValue={ticket.adminNote ?? ""}
                rows={4}
                className="mt-2 w-full rounded-lg border border-white/[0.12] bg-[#0c0d10] px-3 py-2 text-sm text-zinc-100"
                placeholder="Örn. Sorun inceleniyor. Bir sonraki güncellemede düzeltme yayınlanacak."
              />
              <button
                type="submit"
                className="mt-4 rounded-lg bg-red-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-red-300"
              >
                Durumu kaydet
              </button>
            </form>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
              <h2 className="text-2xl font-semibold tracking-tight">Ekler</h2>
              <div className="mt-4 grid gap-2">
                {ticket.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={`/api/admin/support/attachments/${attachment.id}`}
                    className="rounded-lg border border-white/[0.07] bg-[#0c0d10] px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.04]"
                  >
                    {attachment.kind} · {attachment.fileName} ·{" "}
                    {Math.round(attachment.sizeBytes / 1024)} KB
                  </a>
                ))}
                {resultJson ? null : (
                  <p className="text-sm text-zinc-500">Result JSON yok.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

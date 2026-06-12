import { FeatureSuggestionStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";

export const metadata: Metadata = {
  title: "Özellik Önerileri | İmleç Admin",
  description: "Kullanıcıların ürün önerilerini onaylayın, reddedin ve önceliklendirin.",
};

const STATUS_LABELS: Record<FeatureSuggestionStatus, string> = {
  PENDING: "Onay bekliyor",
  APPROVED: "Oylamada",
  REJECTED: "Reddedildi",
  PLANNED: "Planlandı",
  IN_PROGRESS: "Yapılıyor",
  DONE: "Tamamlandı",
  ARCHIVED: "Arşiv",
};

const STATUS_OPTIONS: FeatureSuggestionStatus[] = [
  FeatureSuggestionStatus.PENDING,
  FeatureSuggestionStatus.APPROVED,
  FeatureSuggestionStatus.REJECTED,
  FeatureSuggestionStatus.PLANNED,
  FeatureSuggestionStatus.IN_PROGRESS,
  FeatureSuggestionStatus.DONE,
  FeatureSuggestionStatus.ARCHIVED,
];

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

function statusClass(status: FeatureSuggestionStatus) {
  switch (status) {
    case FeatureSuggestionStatus.PENDING:
      return "border-yellow-300/25 bg-yellow-300/10 text-yellow-100";
    case FeatureSuggestionStatus.APPROVED:
      return "border-blue-300/25 bg-blue-300/10 text-blue-100";
    case FeatureSuggestionStatus.PLANNED:
    case FeatureSuggestionStatus.IN_PROGRESS:
      return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
    case FeatureSuggestionStatus.DONE:
      return "border-white/20 bg-white/10 text-white";
    case FeatureSuggestionStatus.REJECTED:
    case FeatureSuggestionStatus.ARCHIVED:
      return "border-zinc-500/20 bg-zinc-500/10 text-zinc-300";
  }
}

export default async function AdminFeatureSuggestionsPage() {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/feature-suggestions");
  }

  if (admin.status === "forbidden") {
    redirect("/admin");
  }

  const suggestions = await prisma.featureSuggestion.findMany({
    orderBy: [
      { status: "asc" },
      { score: "desc" },
      { createdAt: "desc" },
    ],
    take: 120,
    include: {
      user: {
        select: { email: true, name: true },
      },
    },
  });

  const pendingCount = suggestions.filter(
    (suggestion) => suggestion.status === FeatureSuggestionStatus.PENDING,
  ).length;
  const votingCount = suggestions.filter(
    (suggestion) => suggestion.status === FeatureSuggestionStatus.APPROVED,
  ).length;

  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-blue-300/80">
              Ürün geri bildirimi
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Özellik Önerileri
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Kullanıcı önerilerini önce burada süzün. Uygun olanları
              oylamaya açınca FIS260 içindeki Özellik Öner ekranında görünür.
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05]"
          >
            Admin ana sayfa
          </Link>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Bekleyen</p>
            <p className="mt-3 text-3xl font-semibold text-white">{pendingCount}</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Oylamada</p>
            <p className="mt-3 text-3xl font-semibold text-white">{votingCount}</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Toplam</p>
            <p className="mt-3 text-3xl font-semibold text-white">{suggestions.length}</p>
          </div>
        </section>

        <section className="mt-6 space-y-4">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <article
                key={suggestion.id}
                className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs ${statusClass(suggestion.status)}`}>
                        {STATUS_LABELS[suggestion.status]}
                      </span>
                      <span className="rounded-full border border-white/[0.08] bg-[#0c0f16] px-3 py-1 font-mono text-xs text-zinc-400">
                        {suggestion.productSlug}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatDate(suggestion.createdAt)}
                      </span>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-white">
                      {suggestion.title}
                    </h2>
                    <p className="mt-2 max-w-4xl whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                      {suggestion.description}
                    </p>
                    <p className="mt-3 text-xs text-zinc-500">
                      Gönderen: {suggestion.user.name || suggestion.user.email}
                      {suggestion.appVersion ? ` · Sürüm: ${suggestion.appVersion}` : ""}
                    </p>
                  </div>
                  <div className="grid min-w-[220px] grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-lg border border-emerald-300/15 bg-emerald-300/10 p-3">
                      <p className="text-xs text-emerald-100/75">+</p>
                      <p className="text-lg font-semibold text-emerald-100">{suggestion.upvotes}</p>
                    </div>
                    <div className="rounded-lg border border-red-300/15 bg-red-300/10 p-3">
                      <p className="text-xs text-red-100/75">-</p>
                      <p className="text-lg font-semibold text-red-100">{suggestion.downvotes}</p>
                    </div>
                    <div className="rounded-lg border border-blue-300/15 bg-blue-300/10 p-3">
                      <p className="text-xs text-blue-100/75">Skor</p>
                      <p className="text-lg font-semibold text-blue-100">{suggestion.score}</p>
                    </div>
                  </div>
                </div>

                <form
                  action="/api/admin/feature-suggestions/update"
                  method="post"
                  className="mt-5 grid gap-3 border-t border-white/[0.07] pt-4 lg:grid-cols-[220px_1fr_auto]"
                >
                  <input type="hidden" name="suggestionId" value={suggestion.id} />
                  <label className="text-sm text-zinc-400">
                    Durum
                    <select
                      name="status"
                      defaultValue={suggestion.status}
                      className="mt-2 w-full rounded-lg border border-white/[0.1] bg-[#0c0f16] px-3 py-2 text-sm text-white"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm text-zinc-400">
                    Admin notu
                    <input
                      name="adminNote"
                      defaultValue={suggestion.adminNote ?? ""}
                      placeholder="Kullanıcıya görünecek kısa not"
                      className="mt-2 w-full rounded-lg border border-white/[0.1] bg-[#0c0f16] px-3 py-2 text-sm text-white"
                    />
                  </label>
                  <button
                    type="submit"
                    className="self-end rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
                  >
                    Kaydet
                  </button>
                </form>
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-6 text-sm text-zinc-500">
              Henüz özellik önerisi yok.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

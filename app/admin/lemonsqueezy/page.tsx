import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";

export const metadata: Metadata = {
  title: "Lemon Squeezy | İmleç Yazılım Admin",
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

function JsonPreview({ value }: { value: unknown }) {
  return (
    <details className="rounded-lg border border-white/[0.07] bg-[#0c0d10] p-3">
      <summary className="cursor-pointer text-sm text-zinc-300">Payload</summary>
      <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded bg-black/30 p-3 font-mono text-[11px] leading-5 text-zinc-400">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

export default async function AdminLemonSqueezyPage() {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/lemonsqueezy");
  }

  if (admin.status === "forbidden") {
    redirect("/");
  }

  const [subscriptions, licenses, webhookEvents] = await Promise.all([
    prisma.subscription.findMany({
      where: {
        provider: "lemonsqueezy",
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
      include: {
        user: {
          select: {
            email: true,
          },
        },
        product: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.lemonSqueezyLicense.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
    }),
    prisma.lemonSqueezyWebhookEvent.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    }),
  ]);

  return (
    <main className="min-h-screen bg-[#08090b] px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-sm text-zinc-400 transition hover:text-white">
          ← Admin
        </Link>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Lemon Squeezy
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Test mode subscription, license ve webhook kayıtları burada izlenir.
          Live mode geçişi end-to-end test tamamlanmadan yapılmamalıdır.
        </p>

        <section className="mt-8 grid gap-6">
          <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <h2 className="text-xl font-semibold tracking-tight">Subscriptions</h2>
            <div className="mt-4 overflow-hidden rounded-lg border border-white/[0.07]">
              <div className="grid grid-cols-6 bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
                <span>User</span>
                <span>Product</span>
                <span>Status</span>
                <span>Provider ID</span>
                <span>Renews</span>
                <span>Ends</span>
              </div>
              {subscriptions.length > 0 ? (
                subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="grid grid-cols-6 border-t border-white/[0.07] px-4 py-3 text-sm text-zinc-300"
                  >
                    <span className="truncate">{subscription.user.email}</span>
                    <span>{subscription.product.name}</span>
                    <span>{subscription.status}</span>
                    <span className="truncate font-mono text-xs">
                      {subscription.providerSubscriptionId}
                    </span>
                    <span>{formatDate(subscription.renewsAt)}</span>
                    <span>{formatDate(subscription.endsAt)}</span>
                  </div>
                ))
              ) : (
                <div className="border-t border-white/[0.07] px-4 py-4 text-sm text-zinc-500">
                  Kayıt yok.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <h2 className="text-xl font-semibold tracking-tight">Licenses</h2>
            <div className="mt-4 grid gap-3">
              {licenses.length > 0 ? (
                licenses.map((license) => (
                  <div
                    key={license.id}
                    className="rounded-lg border border-white/[0.07] bg-[#0c0d10] p-4 text-sm"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-mono text-xs text-zinc-300">
                        {license.licenseKeyId}
                      </span>
                      <span className="text-zinc-500">{license.status ?? "-"}</span>
                    </div>
                    <p className="mt-2 text-zinc-500">
                      activation_limit={license.activationLimit ?? "-"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-white/[0.07] bg-[#0c0d10] px-4 py-3 text-sm text-zinc-500">
                  Kayıt yok.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <h2 className="text-xl font-semibold tracking-tight">Webhook Events</h2>
            <div className="mt-4 grid gap-3">
              {webhookEvents.length > 0 ? (
                webhookEvents.map((event) => (
                  <div key={event.id} className="rounded-lg border border-white/[0.07] bg-[#0c0d10] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-white">{event.eventName}</p>
                        <p className="mt-1 font-mono text-xs text-zinc-500">
                          {event.eventId}
                        </p>
                      </div>
                      <span className={event.error ? "text-red-300" : "text-emerald-300"}>
                        {event.error ? event.error : "processed"}
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-xs text-zinc-500">
                      created={formatDate(event.createdAt)} · processed=
                      {formatDate(event.processedAt)}
                    </p>
                    <div className="mt-3">
                      <JsonPreview value={event.payload} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-white/[0.07] bg-[#0c0d10] px-4 py-3 text-sm text-zinc-500">
                  Kayıt yok.
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

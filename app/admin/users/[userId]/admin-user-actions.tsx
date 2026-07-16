"use client";

import { FormEvent, useState, useTransition } from "react";

type ProductOption = {
  id: string;
  name: string;
  slug: string;
};

type EntitlementAction = {
  id: string;
  productName: string;
  status: string;
};

type DeviceAction = {
  id: string;
  productName: string;
  deviceName: string | null;
  status: string;
};

type AdminUserActionsProps = {
  userId: string;
  products: ProductOption[];
  entitlements: EntitlementAction[];
  devices: DeviceAction[];
};

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    throw new Error(data?.error ?? "İşlem tamamlanamadı.");
  }
}

export function AdminUserActions({
  userId,
  products,
  entitlements,
  devices,
}: AdminUserActionsProps) {
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function runAction(action: () => Promise<void>) {
    setMessage(undefined);
    setError(undefined);

    startTransition(async () => {
      try {
        await action();
        setMessage("İşlem tamamlandı. Sayfa yenileniyor.");
        window.location.reload();
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : "İşlem tamamlanamadı.",
        );
      }
    });
  }

  function handleGrant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    runAction(() =>
      postJson("/api/admin/entitlements/grant", {
        userId,
        productId: formData.get("productId"),
        expiresAt: formData.get("expiresAt") || null,
        reason: formData.get("reason") || null,
      }),
    );
  }

  function handleRevokeAll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    runAction(() =>
      postJson("/api/admin/devices/revoke-all", {
        userId,
        productId: formData.get("productId") || null,
        reason: formData.get("reason") || null,
      }),
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-3">
      {message ? (
        <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200 xl:col-span-3">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200 xl:col-span-3">
          {error}
        </p>
      ) : null}

      <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          Ürüne erişim ver
        </h2>
        <form onSubmit={handleGrant} className="mt-4 grid gap-3">
          <select
            name="productId"
            required
            className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none"
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.slug})
              </option>
            ))}
          </select>
          <input
            name="expiresAt"
            type="date"
            className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none"
          />
          <input
            name="reason"
            placeholder="Sebep (opsiyonel)"
            className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600"
          />
          <button
            disabled={isPending}
            className="h-11 rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:opacity-60"
          >
            Erişim ver
          </button>
        </form>
      </article>

      <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          Erişimleri kaldır
        </h2>
        <div className="mt-4 grid gap-2">
          {entitlements.length > 0 ? (
            entitlements.map((entitlement) => (
              <button
                key={entitlement.id}
                disabled={isPending}
                onClick={() =>
                  runAction(() =>
                    postJson("/api/admin/entitlements/revoke", {
                      entitlementId: entitlement.id,
                    }),
                  )
                }
                className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#0c0d10] px-4 py-3 text-left text-sm text-zinc-300 transition hover:bg-white/[0.04] disabled:opacity-60"
              >
                <span>
                  {entitlement.productName} · {entitlement.status}
                </span>
                <span className="text-red-300">Erişimi kaldır</span>
              </button>
            ))
          ) : (
            <p className="text-sm text-zinc-500">Erişim kaydı yok.</p>
          )}
        </div>
      </article>

      <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          Cihazları sıfırla
        </h2>
        <div className="mt-4 grid gap-2">
          {devices.length > 0 ? (
            devices.map((device) => (
              <button
                key={device.id}
                disabled={isPending}
                onClick={() =>
                  runAction(() =>
                    postJson("/api/admin/devices/revoke", {
                      deviceId: device.id,
                    }),
                  )
                }
                className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#0c0d10] px-4 py-3 text-left text-sm text-zinc-300 transition hover:bg-white/[0.04] disabled:opacity-60"
              >
                <span>
                  {device.deviceName ?? "İsimsiz cihaz"} · {device.productName} ·{" "}
                  {device.status}
                </span>
                <span className="text-red-300">Cihazı sıfırla</span>
              </button>
            ))
          ) : (
            <p className="text-sm text-zinc-500">Kayıtlı cihaz yok.</p>
          )}
        </div>

        <form onSubmit={handleRevokeAll} className="mt-5 grid gap-3">
          <select
            name="productId"
            className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none"
          >
            <option value="">Tüm ürünler</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <input
            name="reason"
            placeholder="Sebep (opsiyonel)"
            className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600"
          />
          <button
            disabled={isPending}
            className="h-11 rounded-lg border border-red-400/25 bg-red-400/10 px-5 text-sm font-medium text-red-200 transition hover:bg-red-400/15 disabled:opacity-60"
          >
            Tüm cihazları sıfırla
          </button>
        </form>
      </article>
    </section>
  );
}

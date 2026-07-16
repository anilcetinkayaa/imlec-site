"use client";

import { useActionState, useState } from "react";
import { adminInputClass } from "@/components/admin/ui";
import { cn } from "@/lib/cn";
import { grantCampaign, type CampaignGrantState } from "./actions";

const initialState: CampaignGrantState = {};

export type CampaignPreset = {
  code: string;
  title: string;
  days: number;
  description: string;
};

export function CampaignGrantForm({
  presets,
  products,
  customerEmails,
}: {
  presets: CampaignPreset[];
  products: Array<{ id: string; name: string; slug: string }>;
  customerEmails: string[];
}) {
  const [state, formAction, isPending] = useActionState(
    grantCampaign,
    initialState,
  );
  const [selectedCode, setSelectedCode] = useState(presets[0]?.code ?? "");
  const [days, setDays] = useState(presets[0]?.days ?? 7);

  function applyPreset(code: string) {
    const preset = presets.find((item) => item.code === code);
    if (!preset) return;
    setSelectedCode(preset.code);
    setDays(preset.days);
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        {presets.map((preset) => (
          <button
            key={preset.code}
            type="button"
            onClick={() => applyPreset(preset.code)}
            className={cn(
              "rounded-[var(--radius-lg)] border p-5 text-left transition",
              selectedCode === preset.code
                ? "border-[var(--warning)]/50 bg-[var(--warning)]/[0.09]"
                : "border-[var(--border-subtle)] bg-white/[0.025] hover:border-[var(--warning)]/30 hover:bg-white/[0.04]",
            )}
          >
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--warning)]">
              {preset.days} gün
            </p>
            <h3 className="mt-3 text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              {preset.title}
            </h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {preset.description}
            </p>
          </button>
        ))}
      </div>

      <section className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)]/60 p-5">
        <h2 className="text-h3 text-[var(--text-primary)]">Kampanya tanımla</h2>

        {state.message ? (
          <div
            role="status"
            className={`mt-4 rounded-[var(--radius-md)] border px-4 py-3 text-sm ${
              state.ok
                ? "border-[var(--success)]/25 bg-[var(--success)]/[0.08] text-[var(--text-primary)]"
                : "border-[var(--danger)]/25 bg-[var(--danger)]/[0.08] text-[var(--text-primary)]"
            }`}
          >
            {state.message}
          </div>
        ) : null}

        <form action={formAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
            Kullanıcı e-postası
            <input
              name="email"
              type="email"
              required
              list="campaign-customer-emails"
              placeholder="musteri@example.com"
              className={adminInputClass()}
            />
            <datalist id="campaign-customer-emails">
              {customerEmails.map((email) => (
                <option key={email} value={email} />
              ))}
            </datalist>
          </label>
          <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
            Ürün
            <select name="productId" required className={adminInputClass()}>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.slug})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
            Kampanya tipi
            <select
              name="campaignCode"
              required
              value={selectedCode}
              onChange={(event) => applyPreset(event.target.value)}
              className={adminInputClass()}
            >
              {presets.map((preset) => (
                <option key={preset.code} value={preset.code}>
                  {preset.title}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
            Gün
            <input
              name="days"
              type="number"
              min={1}
              max={365}
              required
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className={adminInputClass()}
            />
          </label>
          <label className="grid gap-2 text-sm text-[var(--text-secondary)] md:col-span-2">
            Not
            <textarea
              name="reason"
              rows={3}
              placeholder="Örn. İlk görüşme sonrası 7 gün deneme verildi."
              className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-0)]/70 px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-brand)]/60"
            />
          </label>
          <div className="md:col-span-2">
            <button
              disabled={isPending}
              className="h-11 rounded-[var(--radius-sm)] bg-[var(--warning)] px-5 text-sm font-medium text-[oklch(0.25_0.06_80)] transition hover:brightness-110 disabled:opacity-60"
            >
              {isPending ? "Uygulanıyor..." : "Kampanyayı uygula"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

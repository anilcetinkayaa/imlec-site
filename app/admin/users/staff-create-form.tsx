"use client";

import { useActionState, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  ADMIN_PERMISSIONS,
  type AdminPermissionKey,
} from "@/src/server/admin-permissions";
import { adminInputClass } from "@/components/admin/ui";
import { cn } from "@/lib/cn";
import { createStaffUser, type StaffCreateState } from "./actions";

const initialState: StaffCreateState = {};

const ROLE_TEMPLATES: Array<{
  key: string;
  label: string;
  description: string;
  permissions: AdminPermissionKey[];
}> = [
  {
    key: "support",
    label: "Destek Personeli",
    description: "Müşteri, destek ve öneri ekranları",
    permissions: [
      "DASHBOARD_VIEW",
      "CUSTOMER_MANAGE",
      "SUPPORT_VIEW",
      "FEATURE_SUGGESTION_MANAGE",
    ],
  },
  {
    key: "finance",
    label: "Muhasebe",
    description: "Ödeme, iade ve Lemon Squeezy ekranları",
    permissions: ["DASHBOARD_VIEW", "BILLING_VIEW", "LEMONSQUEEZY_VIEW"],
  },
  {
    key: "operations",
    label: "Operasyon",
    description: "Sürüm, duyuru, güvenlik ve şirketler",
    permissions: [
      "DASHBOARD_VIEW",
      "RELEASE_MANAGE",
      "SECURITY_VIEW",
      "ORGANIZATION_MANAGE",
    ],
  },
  {
    key: "full",
    label: "Tam Yetki",
    description: "Tüm ekranlara erişim",
    permissions: ADMIN_PERMISSIONS.map((permission) => permission.key),
  },
];

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          // pano erişimi engellendiyse sessiz geç
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] transition hover:bg-white/[0.06] hover:text-[var(--text-primary)]"
    >
      {copied ? (
        <Check className="size-3.5 text-[var(--success)]" strokeWidth={2} />
      ) : (
        <Copy className="size-3.5" strokeWidth={1.6} />
      )}
      {copied ? "Kopyalandı" : label}
    </button>
  );
}

export function StaffCreateForm() {
  const [state, formAction, isPending] = useActionState(
    createStaffUser,
    initialState,
  );
  const [selected, setSelected] = useState<Set<AdminPermissionKey>>(
    () => new Set(),
  );
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, typeof ADMIN_PERMISSIONS[number][]>();
    for (const permission of ADMIN_PERMISSIONS) {
      const list = map.get(permission.group) ?? [];
      list.push(permission);
      map.set(permission.group, list);
    }
    return [...map.entries()];
  }, []);

  function togglePermission(key: AdminPermissionKey) {
    setActiveTemplate(null);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function applyTemplate(templateKey: string) {
    const template = ROLE_TEMPLATES.find((item) => item.key === templateKey);
    if (!template) return;
    setActiveTemplate(templateKey);
    setSelected(new Set(template.permissions));
  }

  return (
    <section className="mt-6 rounded-[var(--radius-lg)] border border-[var(--accent-brand)]/15 bg-[var(--accent-brand)]/[0.045] p-5">
      <h2 className="text-h3 text-[var(--text-primary)]">
        Personel hesabı oluştur
      </h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Kullanıcı adı veya e-posta tanımlayabilirsiniz. Şifre otomatik üretilir
        ve yalnızca bu ekranda gösterilir.
      </p>

      {state.message ? (
        <div
          className={`mt-4 rounded-[var(--radius-md)] border px-4 py-3 text-sm ${
            state.ok
              ? "border-[var(--success)]/25 bg-[var(--success)]/[0.08] text-[var(--text-primary)]"
              : "border-[var(--danger)]/25 bg-[var(--danger)]/[0.08] text-[var(--text-primary)]"
          }`}
        >
          <p>{state.message}</p>
          {state.ok && state.username && state.temporaryPassword ? (
            <div className="mt-3 grid gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-0)]/80 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-[var(--text-secondary)]">
                  Kullanıcı adı:{" "}
                  <span className="text-[var(--text-primary)]">{state.username}</span>
                </span>
                <CopyButton value={state.username} label="Kopyala" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-[var(--text-secondary)]">
                  Geçici şifre:{" "}
                  <span className="text-[var(--text-primary)]">
                    {state.temporaryPassword}
                  </span>
                </span>
                <CopyButton value={state.temporaryPassword} label="Kopyala" />
              </div>
              <CopyButton
                value={`Kullanıcı adı: ${state.username}\nGeçici şifre: ${state.temporaryPassword}\nGiriş: https://imlecyazilim.com/login`}
                label="İkisini birden kopyala"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <form action={formAction} className="mt-4 grid gap-5">
        <div className="grid gap-3 lg:grid-cols-4">
          <input
            name="name"
            required
            placeholder="Ad Soyad"
            className={adminInputClass()}
          />
          <input
            name="username"
            placeholder="Kullanıcı adı"
            className={adminInputClass()}
          />
          <input
            name="email"
            type="email"
            placeholder="E-posta (opsiyonel)"
            className={adminInputClass()}
          />
          <input
            name="staffTitle"
            placeholder="Unvan (örn. Destek Uzmanı)"
            className={adminInputClass()}
          />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            Rol şablonu
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {ROLE_TEMPLATES.map((template) => (
              <button
                key={template.key}
                type="button"
                onClick={() => applyTemplate(template.key)}
                className={cn(
                  "rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition",
                  activeTemplate === template.key
                    ? "border-[var(--accent-brand)]/50 bg-[var(--accent-brand)]/15"
                    : "border-[var(--border-default)] bg-[var(--surface-0)]/60 hover:border-[var(--accent-brand)]/30 hover:bg-white/[0.04]",
                )}
              >
                <span className="block text-sm font-medium text-[var(--text-primary)]">
                  {template.label}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--text-tertiary)]">
                  {template.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              Ekran yetkileri ({selected.size} seçili)
            </p>
            {selected.size > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setSelected(new Set());
                  setActiveTemplate(null);
                }}
                className="text-xs text-[var(--text-tertiary)] underline-offset-2 transition hover:text-[var(--text-primary)] hover:underline"
              >
                Temizle
              </button>
            ) : null}
          </div>
          <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {groups.map(([group, permissions]) => (
              <div
                key={group}
                className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-0)]/50 p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                  {group}
                </p>
                <div className="mt-2 grid gap-1.5">
                  {permissions.map((permission) => (
                    <label
                      key={permission.key}
                      className="flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-[var(--text-secondary)] transition hover:bg-white/[0.04]"
                    >
                      <input
                        name="permissions"
                        type="checkbox"
                        value={permission.key}
                        checked={selected.has(permission.key)}
                        onChange={() => togglePermission(permission.key)}
                        className="mt-0.5 size-4 accent-[oklch(0.70_0.18_250)]"
                      />
                      <span className="leading-snug">{permission.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          disabled={isPending || selected.size === 0}
          className="h-11 w-full rounded-[var(--radius-sm)] bg-[var(--accent-brand)] px-5 text-sm font-semibold text-[oklch(0.15_0.04_250)] transition hover:brightness-110 disabled:opacity-50 sm:w-auto sm:justify-self-start"
        >
          {isPending ? "Oluşturuluyor..." : "Personel hesabını oluştur"}
        </button>
        {selected.size === 0 ? (
          <p className="-mt-3 text-xs text-[var(--text-tertiary)]">
            Oluşturmak için en az bir ekran yetkisi seçin veya bir rol şablonu
            uygulayın.
          </p>
        ) : null}
      </form>
    </section>
  );
}

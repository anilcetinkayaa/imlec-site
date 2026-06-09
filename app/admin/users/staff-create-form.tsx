"use client";

import { useActionState } from "react";
import { ADMIN_PERMISSIONS } from "@/src/server/admin-permissions";
import {
  createStaffUser,
  type StaffCreateState,
} from "./actions";

const initialState: StaffCreateState = {};

export function StaffCreateForm() {
  const [state, formAction, isPending] = useActionState(
    createStaffUser,
    initialState,
  );

  return (
    <section className="mt-6 rounded-xl border border-blue-300/15 bg-blue-300/[0.045] p-5">
      <h2 className="text-xl font-semibold tracking-tight">
        Personel hesabi olustur
      </h2>
      <p className="mt-2 text-sm text-zinc-400">
        Ad soyad girildiginde GVARDARLI mantiginda kullanici adi
        onerebilirsiniz. Sifre otomatik uretilir ve sadece bu ekranda gosterilir.
      </p>

      {state.message ? (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            state.ok
              ? "border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-100"
              : "border-red-300/25 bg-red-300/[0.08] text-red-100"
          }`}
        >
          <p>{state.message}</p>
          {state.ok ? (
            <div className="mt-3 grid gap-2 rounded-lg border border-white/[0.08] bg-[#090b10] p-3 font-mono text-xs text-white">
              <span>Kullanici adi: {state.username}</span>
              <span>Gecici sifre: {state.temporaryPassword}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <form action={formAction} className="mt-4 grid gap-4">
        <div className="grid gap-3 lg:grid-cols-4">
          <input
            name="name"
            required
            placeholder="Ad soyad: Gizem Vardarli"
            className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600"
          />
          <input
            name="username"
            placeholder="Kullanici adi: GVARDARLI"
            className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600"
          />
          <input
            name="email"
            type="email"
            placeholder="Email opsiyonel"
            className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600"
          />
          <input
            name="staffTitle"
            placeholder="Unvan: Destek Uzmani"
            className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-sm text-white outline-none placeholder:text-zinc-600"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ADMIN_PERMISSIONS.map((permission) => (
            <label
              key={permission.key}
              className="flex min-h-14 items-start gap-3 rounded-lg border border-white/[0.08] bg-[#0c0d10] px-3 py-3 text-sm text-zinc-300"
            >
              <input
                name="permissions"
                type="checkbox"
                value={permission.key}
                className="mt-1 size-4 accent-blue-400"
              />
              <span>
                <span className="block text-white">{permission.label}</span>
                <span className="text-xs text-zinc-500">{permission.group}</span>
              </span>
            </label>
          ))}
        </div>

        <button
          disabled={isPending}
          className="h-11 rounded-lg bg-blue-400 px-5 text-sm font-semibold text-blue-950 transition hover:bg-blue-300 disabled:opacity-60"
        >
          {isPending ? "Olusturuluyor..." : "Personel hesabini olustur"}
        </button>
      </form>
    </section>
  );
}

"use client";

import { useActionState } from "react";
import { verify2FAAction, type Verify2FAState } from "../actions";

const initialState: Verify2FAState = {
  ok: false,
};

export function Verify2FAForm() {
  const [state, formAction, isPending] = useActionState(
    verify2FAAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      {state.error ? (
        <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}

      {state.ok ? (
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          <p>2FA doğrulandı. Admin paneline dönebilirsiniz.</p>
          {state.recoveryCodes ? (
            <div className="mt-4">
              <p className="font-medium">Kurtarma kodları</p>
              <p className="mt-1 text-emerald-100/80">
                Bu kodlar yalnızca bir kez gösterilir.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
                {state.recoveryCodes.map((code) => (
                  <span key={code} className="rounded bg-black/25 px-2 py-1">
                    {code}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <a
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-zinc-100 px-4 text-sm font-medium text-zinc-950"
            href="/admin"
          >
            Admin paneline git
          </a>
        </div>
      ) : null}

      <label className="grid gap-2 text-sm">
        <span className="text-zinc-400">6 haneli kod veya kurtarma kodu</span>
        <input
          autoComplete="one-time-code"
          className="h-12 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 font-mono text-lg tracking-[0.12em] text-white outline-none transition focus:border-blue-300/50"
          inputMode="text"
          maxLength={9}
          name="token"
          placeholder="000000"
          required
        />
      </label>

      <button
        className="h-11 rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? "Doğrulanıyor..." : "Doğrula"}
      </button>
    </form>
  );
}

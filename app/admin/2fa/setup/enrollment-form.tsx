"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  verify2FAAction,
  type Verify2FAState,
} from "@/app/admin/2fa/actions";

const initialState: Verify2FAState = {
  ok: false,
};

export function TwoFactorEnrollment({
  qrDataUrl,
}: {
  qrDataUrl: string;
}) {
  const [state, formAction, isPending] = useActionState(
    verify2FAAction,
    initialState,
  );

  if (state.ok) {
    return (
      <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm text-emerald-100">
        <p className="font-medium">2FA kurulumu tamamlandı.</p>
        <p className="mt-2 text-emerald-100/80">
          QR kod artık gösterilmeyecek. Sonraki girişlerde Authenticator
          uygulamanızdaki 6 haneli kod istenecek.
        </p>
        {state.recoveryCodes ? (
          <div className="mt-5">
            <p className="font-medium">Kurtarma kodları</p>
            <p className="mt-1 text-emerald-100/80">
              Bu kodlar yalnızca bir kez gösterilir. Güvenli bir yerde
              saklayın.
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
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-zinc-100 px-4 text-sm font-medium text-zinc-950"
          href="/admin"
        >
          Admin paneline git
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 flex justify-center rounded-xl border border-white/[0.08] bg-white p-4">
        <Image
          alt="Admin 2FA QR kodu"
          height={240}
          src={qrDataUrl}
          width={240}
        />
      </div>

      <form action={formAction} className="mt-6 grid gap-4">
        {state.error ? (
          <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {state.error}
          </p>
        ) : null}

        <div className="border-t border-white/[0.08] pt-6">
          <h2 className="text-lg font-medium text-white">
            Authenticator kodunu doğrulayın
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Uygulamada görünen 6 haneli kodu aşağıdaki alana girin.
          </p>
        </div>

        <label className="grid gap-2 text-sm">
          <span className="text-zinc-400">6 haneli kod</span>
          <input
            autoComplete="one-time-code"
            autoFocus
            className="h-12 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 font-mono text-lg tracking-[0.12em] text-white outline-none transition focus:border-blue-300/50"
            inputMode="numeric"
            maxLength={6}
            name="token"
            pattern="[0-9]{6}"
            placeholder="000000"
            required
          />
        </label>

        <button
          className="h-11 rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:opacity-60"
          disabled={isPending}
        >
          {isPending ? "Doğrulanıyor..." : "Kurulumu tamamla"}
        </button>
      </form>
    </>
  );
}

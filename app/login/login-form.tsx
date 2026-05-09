"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { loginAction } from "./actions";

type LoginFormProps = {
  callbackUrl: string;
  initialError?: string;
  registered?: boolean;
};

export function LoginForm({
  callbackUrl,
  initialError,
  registered,
}: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState(initialError);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await loginAction(formData);

      if (result.success) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }

      setError(result.error ?? "Email veya şifre hatalı.");
    });
  }

  return (
    <>
      {registered ? (
        <p className="mt-5 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          Kayıt oluşturuldu. Şimdi giriş yapabilirsiniz.
        </p>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
        <label className="grid gap-2 text-sm">
          <span className="text-zinc-400">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-300/50"
            placeholder="demo@imlecyazilim.com"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-zinc-400">Şifre</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-11 rounded-lg border border-white/[0.1] bg-[#0c0d10] px-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-300/50"
            placeholder="••••••••"
          />
        </label>

        <button
          disabled={isPending}
          className="mt-2 inline-flex h-11 items-center justify-center rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Giriş yapılıyor..." : "Giriş yap"}
        </button>
      </form>
    </>
  );
}

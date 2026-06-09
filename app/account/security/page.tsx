import type { Metadata } from "next";
import { AccountPageHeader } from "@/app/account/account-ui";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { changeOwnPassword } from "./actions";

export const metadata: Metadata = {
  title: "Sifre ve Guvenlik | Imlec Yazilim",
};

type AccountSecurityPageProps = {
  searchParams: Promise<{
    password?: string;
  }>;
};

function passwordMessage(status?: string) {
  if (status === "changed") {
    return {
      tone: "border-emerald-300/25 bg-emerald-300/[0.06] text-emerald-100",
      text: "Sifreniz guncellendi. Bir sonraki giriste yeni sifrenizi kullanabilirsiniz.",
    };
  }

  if (status === "wrong") {
    return {
      tone: "border-red-300/25 bg-red-300/[0.06] text-red-100",
      text: "Mevcut sifre hatali. Lutfen tekrar deneyin.",
    };
  }

  if (status === "invalid") {
    return {
      tone: "border-amber-300/25 bg-amber-300/[0.06] text-amber-100",
      text: "Yeni sifre en az 8 karakter olmali ve tekrar alanıyla ayni olmalidir.",
    };
  }

  return null;
}

export default async function AccountSecurityPage({
  searchParams,
}: AccountSecurityPageProps) {
  const params = await searchParams;
  const message = passwordMessage(params.password);

  return (
    <>
      <AccountPageHeader
        eyebrow="Guvenlik"
        title="Sifre ve hesap guvenligi"
        description="Hesabinizin sifresini buradan degistirebilirsiniz. Yetkili hesaplarda sifre paylasimi yerine kisiye ozel hesap kullanin."
      />

      {message ? (
        <Card className={`mb-5 p-5 ${message.tone}`} variant="default">
          <p className="text-body-s">{message.text}</p>
        </Card>
      ) : null}

      <Card className="p-5" variant="default">
        <h2 className="text-h3">Sifre degistir</h2>
        <form action={changeOwnPassword} className="mt-5 grid max-w-xl gap-4">
          <label className="grid gap-2 text-body-s text-[var(--text-secondary)]">
            Mevcut sifre
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              className="h-11 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-[var(--text-primary)] outline-none"
            />
          </label>
          <label className="grid gap-2 text-body-s text-[var(--text-secondary)]">
            Yeni sifre
            <input
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="h-11 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-[var(--text-primary)] outline-none"
            />
          </label>
          <label className="grid gap-2 text-body-s text-[var(--text-secondary)]">
            Yeni sifre tekrar
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="h-11 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-[var(--text-primary)] outline-none"
            />
          </label>
          <Button type="submit">Sifreyi guncelle</Button>
        </form>
      </Card>
    </>
  );
}

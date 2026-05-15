import type { Metadata } from "next";
import { auth } from "@/auth";
import { AccountPageHeader } from "@/app/account/account-ui";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Hesap | İmleç Yazılım",
  description: "İmleç Yazılım hesap profili ve güvenlik tercihleri.",
};

export default async function AccountProfilePage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return (
    <>
      <AccountPageHeader
        description="Profil bilgileri ve güvenlik tercihleri burada gösterilir. Şifre değiştirme ve hesap silme endpointleri hazır olduğunda aksiyonlar bu yüzeye bağlanır."
        eyebrow="Hesap"
        title="Profil ve güvenlik"
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Card className="p-5" variant="elevated">
          <h2 className="text-h4">Profil bilgileri</h2>
          <div className="mt-5 grid gap-4">
            <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
              <p className="text-body-s text-[var(--text-tertiary)]">Ad soyad</p>
              <p className="mt-1 text-body font-medium text-[var(--text-primary)]">
                {session.user.name ?? "İmleç kullanıcısı"}
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
              <p className="text-body-s text-[var(--text-tertiary)]">E-posta</p>
              <p className="text-mono mt-1 text-[var(--text-primary)]">
                {session.user.email}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5" variant="default">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-h4">Güvenlik</h2>
              <p className="text-body-s mt-2 text-[var(--text-secondary)]">
                Şifre ve hesap işlemleri mevcut auth akışına zarar vermeden ayrı
                endpointlerle bağlanmalıdır.
              </p>
            </div>
            <Badge variant="beta">Planlı</Badge>
          </div>

          <div className="mt-5 grid gap-3">
            <Button disabled variant="outline">
              Şifre değiştir
            </Button>
            <Button disabled variant="outline">
              KVKK izni yönet
            </Button>
            <Button disabled variant="destructive">
              Hesabı sil
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}

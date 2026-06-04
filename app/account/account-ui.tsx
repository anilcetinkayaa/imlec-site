import Link from "next/link";
import {
  Check,
  CreditCard,
  Download,
  ExternalLink,
  LockKeyhole,
  MonitorCheck,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function formatPaymentAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("tr-TR", {
    currency,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(amount / 100);
}

export function formatDate(date: Date | null) {
  if (!date) {
    return "Tarih yok";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function AccountPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-label text-[var(--accent-brand)]">{eyebrow}</p>
      <h1 className="text-h2 mt-3">{title}</h1>
      <p className="text-body mt-3 max-w-3xl text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  );
}

export function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Card className="p-5" variant="default">
      <p className="text-body-s text-[var(--text-tertiary)]">{label}</p>
      <p className="mt-3 font-mono text-3xl font-semibold tracking-[-0.02em]">
        {value}
      </p>
      <p className="text-body-s mt-2 text-[var(--text-secondary)]">{note}</p>
    </Card>
  );
}

export function ProductAccessCard({
  product,
}: {
  product: {
    slug: string;
    name: string;
    hasAccess: boolean;
    entitlementStatus: string;
    expiresAt: Date | null;
  };
}) {
  const isFis260 = product.slug === "fis260";

  return (
    <Card className="p-5" variant="interactive">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--accent-fis260)]/30 bg-[var(--accent-fis260)]/12 text-[var(--accent-fis260)]">
            {product.hasAccess ? (
              <Check className="size-5" strokeWidth={1.5} />
            ) : (
              <LockKeyhole className="size-5" strokeWidth={1.5} />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-h4">{product.name}</h2>
              <Badge variant={product.hasAccess ? "active" : "coming-soon"}>
                {product.hasAccess ? "Aktif" : "Erişim yok"}
              </Badge>
            </div>
            <p className="text-body-s mt-2 text-[var(--text-secondary)]">
              Durum:{" "}
              <span className="text-mono text-[var(--text-primary)]">
                {product.entitlementStatus}
              </span>
              {" · "}Bitiş:{" "}
              <span className="text-mono text-[var(--text-primary)]">
                {formatDate(product.expiresAt)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:min-w-44">
          {product.hasAccess && isFis260 ? (
            <Button asChild>
              <Link href="/api/downloads/fis260">
                <Download className="size-4" strokeWidth={1.5} />
                Windows için indir
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href={isFis260 ? "/uyelik" : `/${product.slug}`}>
                Ürünü incele
              </Link>
            </Button>
          )}
          {product.hasAccess ? (
            <Button asChild variant="ghost">
              <Link href="/account/devices">
                <MonitorCheck className="size-4" strokeWidth={1.5} />
                Cihazlarım
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export function DeviceTable({
  devices,
}: {
  devices: Array<{
    id: string;
    deviceName: string | null;
    os: string | null;
    appVersion: string | null;
    status: string;
    lastSeenAt: Date | null;
    product: {
      name: string;
    };
  }>;
}) {
  return (
    <Card className="overflow-hidden" variant="default">
      <div className="grid grid-cols-[1.3fr_0.9fr_0.8fr_0.8fr_0.8fr_0.7fr] gap-4 border-b border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3 text-body-s text-[var(--text-tertiary)]">
        <span>Cihaz</span>
        <span>Ürün</span>
        <span>OS</span>
        <span>Son görülme</span>
        <span>Durum</span>
        <span>İşlem</span>
      </div>
      {devices.length > 0 ? (
        devices.map((device) => (
          <div
            key={device.id}
            className="grid grid-cols-[1.3fr_0.9fr_0.8fr_0.8fr_0.8fr_0.7fr] gap-4 border-b border-[var(--border-subtle)] px-4 py-3 text-body-s last:border-b-0"
          >
            <span className="min-w-0 truncate text-[var(--text-primary)]">
              {device.deviceName ?? "İsimsiz cihaz"}
            </span>
            <span className="text-[var(--text-secondary)]">{device.product.name}</span>
            <span className="text-mono text-[var(--text-secondary)]">
              {device.os ?? "Bilinmiyor"}
            </span>
            <span className="text-mono text-[var(--text-secondary)]">
              {formatDate(device.lastSeenAt)}
            </span>
            <span className="flex items-center justify-between gap-2">
              <Badge variant={device.status === "ACTIVE" ? "active" : "coming-soon"}>
                {device.status}
              </Badge>
            </span>
            <span>
              {device.status === "ACTIVE" ? (
                <form action="/api/account/devices/revoke" method="post">
                  <input type="hidden" name="deviceId" value={device.id} />
                  <Button size="sm" variant="ghost">
                    Kaldır
                  </Button>
                </form>
              ) : (
                <span className="text-[var(--text-tertiary)]">-</span>
              )}
            </span>
          </div>
        ))
      ) : (
        <div className="px-4 py-5 text-body-s text-[var(--text-tertiary)]">
          Kayıtlı cihaz yok.
        </div>
      )}
    </Card>
  );
}

export function BillingTable({
  payments,
  invoices,
}: {
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    paidAt: Date | null;
    createdAt: Date;
    product: {
      name: string;
    };
  }>;
  invoices: Array<{
    id: string;
    provider: string;
    invoiceUrl: string | null;
    downloadUrl: string | null;
    issuedAt: Date | null;
    product: {
      name: string;
    };
  }>;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="overflow-hidden" variant="default">
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3">
          <CreditCard className="size-4 text-[var(--text-tertiary)]" strokeWidth={1.5} />
          <h2 className="text-body-s font-medium">Ödeme kayıtları</h2>
        </div>
        {payments.length > 0 ? (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="grid grid-cols-[1fr_auto] gap-3 border-b border-[var(--border-subtle)] px-4 py-3 last:border-b-0"
            >
              <div>
                <p className="text-body-s font-medium text-[var(--text-primary)]">
                  {payment.product.name}
                </p>
                <p className="text-mono mt-1 text-[var(--text-tertiary)]">
                  {formatDate(payment.paidAt ?? payment.createdAt)} · {payment.status}
                </p>
              </div>
              <span className="text-mono text-[var(--text-primary)]">
                {formatPaymentAmount(payment.amount, payment.currency)}
              </span>
            </div>
          ))
        ) : (
          <div className="px-4 py-5 text-body-s text-[var(--text-tertiary)]">
            Henüz ödeme kaydı yok.
          </div>
        )}
      </Card>

      <Card className="overflow-hidden" variant="default">
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3">
          <ShieldCheck className="size-4 text-[var(--text-tertiary)]" strokeWidth={1.5} />
          <h2 className="text-body-s font-medium">Faturalar</h2>
        </div>
        {invoices.length > 0 ? (
          invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex flex-col gap-3 border-b border-[var(--border-subtle)] px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-body-s font-medium text-[var(--text-primary)]">
                  {invoice.product.name}
                </p>
                <p className="text-mono mt-1 text-[var(--text-tertiary)]">
                  {invoice.provider} · {formatDate(invoice.issuedAt)}
                </p>
              </div>
              <div className="flex gap-2">
                {invoice.invoiceUrl ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={invoice.invoiceUrl}>
                      Görüntüle
                      <ExternalLink className="size-3.5" strokeWidth={1.5} />
                    </Link>
                  </Button>
                ) : null}
                {invoice.downloadUrl ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={invoice.downloadUrl}>İndir</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-5 text-body-s text-[var(--text-tertiary)]">
            Henüz fatura kaydı yok.
          </div>
        )}
      </Card>
    </div>
  );
}

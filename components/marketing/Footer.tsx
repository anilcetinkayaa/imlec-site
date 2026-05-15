import Link from "next/link";

const columns = [
  {
    title: "Ürün",
    links: [
      { href: "/fis260", label: "FİŞ260" },
      { href: "/cozver", label: "ÇÖZVER" },
      { href: "/api/downloads/fis260", label: "Windows için indir" },
    ],
  },
  {
    title: "Şirket",
    links: [
      { href: "/", label: "Platform" },
      { href: "/#updates", label: "Güncellemeler" },
      { href: "/changelog", label: "Değişiklikler" },
    ],
  },
  {
    title: "Yasal",
    links: [
      { href: "/security", label: "Güvenlik" },
      { href: "/security#kvkk", label: "KVKK" },
      { href: "/account", label: "Hesap paneli" },
    ],
  },
  {
    title: "Destek",
    links: [
      { href: "mailto:info@imlecyazilim.com", label: "E-posta" },
      { href: "/login", label: "Giriş" },
      { href: "/register", label: "Hesap oluştur" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--surface-0)] px-6 py-12 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-label text-[var(--text-tertiary)]">
                {column.title}
              </h2>
              <nav className="mt-4 grid gap-3">
                {column.links.map((link) => (
                  <Link
                    key={`${column.title}-${link.href}`}
                    href={link.href}
                    className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-6 text-sm text-[var(--text-tertiary)] sm:flex-row sm:items-center sm:justify-between">
          <p>İmleç Yazılım © 2026</p>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-[var(--text-secondary)]">TR</span>
            <span aria-disabled="true" className="text-[var(--text-tertiary)]">
              EN yakında
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

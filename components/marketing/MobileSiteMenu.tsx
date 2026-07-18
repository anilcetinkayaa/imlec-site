"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navItems = [
  { href: "/#products", label: "Ürünler" },
  { href: "/uyelik", label: "Abone ol" },
];

export function MobileSiteMenu({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        aria-expanded={open}
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        className="inline-flex size-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-white/[0.035] text-[var(--text-secondary)] transition hover:bg-white/[0.06] hover:text-[var(--text-primary)]"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {open ? (
          <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
        ) : (
          <Menu aria-hidden="true" className="size-5" strokeWidth={1.5} />
        )}
      </button>

      {open ? (
        <>
          <button
            aria-label="Menüyü kapat"
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            type="button"
          />
          <aside className="fixed inset-y-0 right-0 z-50 w-[min(88vw,360px)] border-l border-[var(--border-default)] bg-[var(--surface-1)]/96 p-5 shadow-[0_24px_70px_oklch(0_0_0/0.5)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <p className="font-medium text-[var(--text-primary)]">Menü</p>
              <button
                aria-label="Menüyü kapat"
                className="inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-[var(--text-primary)]"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
              </button>
            </div>
            <nav className="mt-5 grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[var(--radius-sm)] px-3 py-3 text-sm text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-[var(--text-primary)]"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/api/downloads/launcher"
                className="rounded-[var(--radius-sm)] px-3 py-3 text-sm text-[var(--accent-brand)] hover:bg-[var(--accent-brand)]/10"
                onClick={() => setOpen(false)}
              >
                İmleç Launcher&apos;ı indir
              </Link>
              <Link
                href={signedIn ? "/account" : "/login"}
                className="rounded-[var(--radius-sm)] px-3 py-3 text-sm text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-[var(--text-primary)]"
                onClick={() => setOpen(false)}
              >
                {signedIn ? "Hesabım" : "Giriş"}
              </Link>
              {!signedIn ? (
                <Link
                  href="/register"
                  className="rounded-[var(--radius-sm)] px-3 py-3 text-sm text-[var(--text-primary)] hover:bg-white/[0.05]"
                  onClick={() => setOpen(false)}
                >
                  Hesap oluştur
                </Link>
              ) : null}
            </nav>
          </aside>
        </>
      ) : null}
    </div>
  );
}

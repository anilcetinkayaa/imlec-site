"use client";

import { useEffect } from "react";

/** Sayfa açılır açılmaz indirmeyi tetikler; sayfa içeriği (rehber) görünür kalır. */
export function AutoDownload({ href }: { href: string }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = href;
    }, 700);
    return () => clearTimeout(timer);
  }, [href]);

  return null;
}

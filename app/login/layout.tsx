import type { ReactNode } from "react";
import { AuthPageShell } from "@/components/marketing/AuthPageShell";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <AuthPageShell>{children}</AuthPageShell>;
}

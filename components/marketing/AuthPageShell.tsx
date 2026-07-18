import type { ReactNode } from "react";
import { Rev9Atmosphere } from "@/components/rev9/Rev9Atmosphere";

export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="rev9-page rev9-auth-page relative isolate min-h-screen">
      <Rev9Atmosphere />
      <style>{
        ".rev9-auth-page main { position: relative; z-index: 10; background: transparent !important; }"
      }</style>
      {children}
    </div>
  );
}

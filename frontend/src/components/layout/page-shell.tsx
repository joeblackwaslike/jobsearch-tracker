import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-7xl p-6">{children}</main>;
}

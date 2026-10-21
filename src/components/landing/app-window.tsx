import type { ReactNode } from "react";

/** Static app frame for landing-page previews, built in the app's own tokens. */
export function AppWindow({ label, toolbar, children }: { label: string; toolbar?: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background shadow-2xl shadow-black/10">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
        <span className="size-2.5 rounded-full bg-border" aria-hidden />
        <span className="size-2.5 rounded-full bg-border" aria-hidden />
        <span className="size-2.5 rounded-full bg-border" aria-hidden />
        <span className="ml-2 text-xs text-muted">{label}</span>
        {toolbar && <div className="ml-auto">{toolbar}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

import Link from "next/link";
import { cn } from "@/lib/utils";

/** Flat brand mark: a retention curve that hooks back up (OpenReply-style dark tile). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7 shrink-0", className)} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#18181b" />
      <path
        d="M6.5 9.5c2.2 0 3 8.6 6.4 9.8 2.7.9 4.4-3.3 6.9-3.3 2.1 0 2.9 2.6 5.7 2.6"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="25.5" cy="18.6" r="2.1" fill="#f97316" />
      <path d="M6.5 23.5h19" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ href = "/", size = "md", className }: { href?: string; size?: "sm" | "md"; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label="ScriptHook AI home">
      <LogoMark className={size === "sm" ? "size-6" : "size-7"} />
      <span className={cn("text-foreground", size === "sm" ? "text-base font-semibold" : "text-lg font-bold")}>ScriptHook AI</span>
    </Link>
  );
}

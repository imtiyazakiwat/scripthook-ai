import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <defs>
        <linearGradient id="lm-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b6bff" />
          <stop offset="0.6" stopColor="#6844f5" />
          <stop offset="1" stopColor="#d1449a" />
        </linearGradient>
        <linearGradient id="lm-line" x1="6" y1="10" x2="26" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#lm-bg)" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke="#fff" strokeOpacity="0.18" />
      {/* retention curve that hooks back up */}
      <path
        d="M6.5 9.5c2.2 0 3 8.6 6.4 9.8 2.7.9 4.4-3.3 6.9-3.3 2.1 0 2.9 2.6 5.7 2.6"
        fill="none"
        stroke="url(#lm-line)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="25.5" cy="18.6" r="2.1" fill="#fff" />
      <path d="M6.5 23.5h19" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ href = "/", className, suffix }: { href?: string; className?: string; suffix?: React.ReactNode }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="ScriptHook AI home">
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6" />
      <span className="text-[15px] font-semibold tracking-tight text-white">
        ScriptHook<span className="text-brand-300"> AI</span>
      </span>
      {suffix}
    </Link>
  );
}

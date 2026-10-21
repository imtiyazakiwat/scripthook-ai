import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "success";
type Size = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "text-white bg-[linear-gradient(135deg,var(--color-brand-500),var(--color-brand-600)_55%,#8f3df0)] shadow-[0_0_0_1px_rgb(255_255_255/0.12)_inset,0_10px_30px_-10px_rgb(124_92_255/0.8)] hover:brightness-110 active:brightness-95",
  secondary: "bg-white/[0.07] text-ink-100 border border-white/10 hover:bg-white/[0.11] hover:border-white/15",
  outline: "border border-white/12 text-ink-100 hover:bg-white/[0.05] hover:border-white/20",
  ghost: "text-ink-300 hover:text-ink-100 hover:bg-white/[0.06]",
  danger: "bg-leak-high/15 text-leak-high border border-leak-high/25 hover:bg-leak-high/20",
  success: "bg-spike/15 text-spike border border-spike/25 hover:bg-spike/20",
};

const sizes: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs gap-1.5 rounded-lg",
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-[15px] gap-2.5 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "md", loading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "relative inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

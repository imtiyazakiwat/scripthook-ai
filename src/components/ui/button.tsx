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

/* Flat OpenReply buttons: solid accent primary, bordered secondary, quiet ghost. */
const variants: Record<Variant, string> = {
  primary: "bg-accent font-semibold text-accent-foreground hover:bg-accent-hover",
  secondary: "border border-border bg-background text-foreground hover:border-border-hover hover:bg-surface-hover",
  outline: "border border-border text-muted hover:border-border-hover hover:text-foreground",
  ghost: "text-muted hover:bg-surface-hover hover:text-foreground",
  danger: "border border-error/30 bg-error/5 text-error hover:bg-error/10",
  success: "border border-success/30 bg-success/10 text-success hover:bg-success/15",
};

const sizes: Record<Size, string> = {
  xs: "h-7 gap-1.5 px-2.5 text-xs",
  sm: "h-8 gap-1.5 px-3 text-[13px]",
  md: "h-9 gap-2 px-4 text-sm",
  lg: "h-11 gap-2 px-6 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "md", loading, disabled, children, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "relative inline-flex select-none items-center justify-center whitespace-nowrap rounded font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
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

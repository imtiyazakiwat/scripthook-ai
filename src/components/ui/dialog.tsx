"use client";

import * as RD from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  hideHeader,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  hideHeader?: boolean;
}) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" />
        <RD.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-background p-6 text-foreground shadow-2xl focus:outline-none sm:p-7",
            className,
          )}
        >
          <div className={cn(hideHeader && "sr-only", "mb-5 pr-8")}>
            <RD.Title className="text-lg font-semibold text-foreground">{title}</RD.Title>
            {description ? (
              <RD.Description className="mt-1 text-sm text-muted">{description}</RD.Description>
            ) : (
              <RD.Description className="sr-only">{title}</RD.Description>
            )}
          </div>
          {children}
          <RD.Close
            className="absolute right-4 top-4 grid size-8 place-items-center rounded text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </RD.Close>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

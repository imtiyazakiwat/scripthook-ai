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
        <RD.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-[fade-in_150ms_ease-out]" />
        <RD.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-[0_40px_120px_-20px_rgb(0_0_0/0.9)] backdrop-blur-xl focus:outline-none data-[state=open]:animate-[dialog-in_180ms_cubic-bezier(0.16,1,0.3,1)]",
            className,
          )}
        >
          <div className={cn(hideHeader && "sr-only", "mb-5 pr-8")}>
            <RD.Title className="text-lg font-semibold tracking-tight text-white">{title}</RD.Title>
            {description ? (
              <RD.Description className="mt-1 text-sm text-ink-300">{description}</RD.Description>
            ) : (
              <RD.Description className="sr-only">{title}</RD.Description>
            )}
          </div>
          {children}
          <RD.Close
            className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-ink-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="size-4" />
          </RD.Close>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

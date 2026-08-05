import React, { createContext, useEffect } from "react";
import { cn } from "@/lib/utils";

const DialogCtx = createContext<{ onOpenChange: (v: boolean) => void } | null>(null);

export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (v: boolean) => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onOpenChange]);
  if (!open) return null;
  return (
    <DialogCtx.Provider value={{ onOpenChange }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-black/45" onClick={() => onOpenChange(false)} />
        {children}
      </div>
    </DialogCtx.Provider>
  );
}
export function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl", className)}>{children}</div>;
}
export const DialogHeader = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (<div className={cn("mb-3", className)} {...p} />);
export const DialogTitle = ({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => (<h2 className={cn("text-xl font-bold", className)} {...p} />);
export const DialogDescription = ({ className, srOnly, ...p }: React.HTMLAttributes<HTMLParagraphElement> & { srOnly?: boolean }) => (
  <p className={cn(srOnly ? "sr-only" : "text-sm text-muted-foreground mt-1", className)} {...p} />
);
export const DialogFooter = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (<div className={cn("flex justify-end gap-2 mt-4", className)} {...p} />);

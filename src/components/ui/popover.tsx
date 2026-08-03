import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Popover({ trigger, children, className }: { trigger: React.ReactNode; children: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <div ref={ref} className="relative inline-block">
      <span onClick={() => setOpen((o) => !o)}>{trigger}</span>
      {open && (
        <div className={cn("absolute z-50 mt-1 right-0 rounded-lg border border-border bg-white p-3 shadow-lg", className)}>
          {children}
        </div>
      )}
    </div>
  );
}

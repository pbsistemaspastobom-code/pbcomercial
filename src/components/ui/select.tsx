import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Ctx {
  value: string; onValueChange: (v: string) => void;
  open: boolean; setOpen: (b: boolean) => void;
  labels: Record<string, string>; register: (v: string, l: string) => void;
}
const SelectCtx = createContext<Ctx | null>(null);
const useSel = () => { const c = useContext(SelectCtx); if (!c) throw new Error("Select"); return c; };

export function Select({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const ref = useRef<HTMLDivElement>(null);
  const register = useCallback((v: string, l: string) => setLabels((m) => (m[v] === l ? m : { ...m, [v]: l })), []);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <SelectCtx.Provider value={{ value, onValueChange, open, setOpen, labels, register }}>
      <div ref={ref} className="relative inline-block">{children}</div>
    </SelectCtx.Provider>
  );
}
export function SelectTrigger({ className, children }: { className?: string; children: React.ReactNode }) {
  const { open, setOpen } = useSel();
  return (
    <button type="button" onClick={() => setOpen(!open)} className={cn("inline-flex items-center justify-between gap-2 h-10 rounded-lg border border-border bg-white px-3 text-sm text-[#3a4730] focus:outline-none focus:ring-2 focus:ring-pasto-medio/40", className)}>
      {children}<ChevronDown className="w-4 h-4 opacity-60 shrink-0" />
    </button>
  );
}
export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value, labels } = useSel();
  const label = labels[value];
  return <span className={cn("truncate", !label && "text-muted-foreground")}>{label ?? placeholder}</span>;
}
export function SelectContent({ children }: { children: React.ReactNode }) {
  const { open } = useSel();
  if (!open) return null;
  return <div className="absolute z-50 mt-1 max-h-72 w-full min-w-[200px] overflow-auto rounded-lg border border-border bg-white p-1 shadow-lg">{children}</div>;
}
export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const { value: selected, onValueChange, setOpen, register } = useSel();
  useEffect(() => { if (typeof children === "string") register(value, children); }, [value, children, register]);
  return (
    <button type="button" onClick={() => { onValueChange(value); setOpen(false); }} className={cn("w-full text-left rounded-md px-2.5 py-1.5 text-sm hover:bg-[#f0f4ee]", selected === value && "bg-pasto-claro text-pasto-escuro font-medium")}>
      {children}
    </button>
  );
}

import React, { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

const TabsCtx = createContext<{ value: string; setValue: (v: string) => void } | null>(null);
const useTabs = () => { const c = useContext(TabsCtx); if (!c) throw new Error("Tabs"); return c; };

export function Tabs({ value, onValueChange, children, className }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode; className?: string }) {
  return <TabsCtx.Provider value={{ value, setValue: onValueChange }}><div className={className}>{children}</div></TabsCtx.Provider>;
}
export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("inline-flex gap-1 rounded-xl border border-border bg-white p-1", className)}>{children}</div>;
}
export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const { value: cur, setValue } = useTabs();
  return (
    <button type="button" onClick={() => setValue(value)} className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-colors", cur === value ? "bg-pasto-escuro text-white" : "text-[#43503a] hover:bg-[#f0f4ee]")}>
      {children}
    </button>
  );
}
export function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const { value: cur } = useTabs();
  if (cur !== value) return null;
  return <div className="mt-5">{children}</div>;
}

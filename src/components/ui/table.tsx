import React from "react";
import { cn } from "@/lib/utils";
export const Table = ({ className, ...p }: React.TableHTMLAttributes<HTMLTableElement>) => (<table className={cn("w-full border-collapse text-sm", className)} {...p} />);
export const TableHeader = (p: React.HTMLAttributes<HTMLTableSectionElement>) => <thead {...p} />;
export const TableBody = (p: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody {...p} />;
export const TableFooter = (p: React.HTMLAttributes<HTMLTableSectionElement>) => <tfoot {...p} />;
export const TableRow = ({ className, ...p }: React.HTMLAttributes<HTMLTableRowElement>) => (<tr className={cn("hover:bg-[#fafcf8]", className)} {...p} />);
export const TableHead = ({ className, ...p }: React.ThHTMLAttributes<HTMLTableCellElement>) => (<th className={cn("text-left px-3 py-2.5 border-b-2 border-pasto-claro text-[11px] uppercase tracking-wide text-[#5c6b4f] font-semibold whitespace-nowrap", className)} {...p} />);
export const TableCell = ({ className, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) => (<td className={cn("px-3 py-2.5 border-b border-[#eef1eb]", className)} {...p} />);

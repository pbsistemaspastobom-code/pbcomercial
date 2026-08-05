import React from "react";
import { cn } from "@/lib/utils";
export const Card = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (<div className={cn("rounded-2xl border border-border bg-white shadow-sm", className)} {...p} />);
export const CardHeader = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (<div className={cn("p-4 pb-2", className)} {...p} />);
export const CardTitle = ({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => (<h3 className={cn("font-semibold leading-none tracking-tight", className)} {...p} />);
export const CardContent = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (<div className={cn("p-4 pt-2", className)} {...p} />);

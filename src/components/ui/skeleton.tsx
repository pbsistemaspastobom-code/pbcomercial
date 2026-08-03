import React from "react";
import { cn } from "@/lib/utils";
export const Skeleton = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (<div className={cn("animate-pulse rounded-md bg-[#e6eae1]", className)} {...p} />);

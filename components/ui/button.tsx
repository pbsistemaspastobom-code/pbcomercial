import React from "react";
import { cn } from "@/lib/utils";
type Variant = "default" | "outline" | "ghost";
type Size = "default" | "sm" | "icon";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: Size; }
const variants: Record<Variant, string> = {
  default: "bg-pasto-escuro text-white hover:bg-pasto-medio",
  outline: "border border-border bg-white text-[#3a4730] hover:bg-[#f0f4ee]",
  ghost: "bg-transparent hover:bg-[#f0f4ee] text-[#3a4730]",
};
const sizes: Record<Size, string> = { default: "h-10 px-4 py-2 text-sm", sm: "h-8 px-3 text-xs", icon: "h-9 w-9" };
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button ref={ref} className={cn("inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none", variants[variant], sizes[size], className)} {...props} />
  )
);
Button.displayName = "Button";

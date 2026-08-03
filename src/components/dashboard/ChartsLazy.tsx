// src/components/dashboard/ChartsLazy.tsx
import React, { Suspense, lazy } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { BarPoint, PiePoint, LinePoint, VendedorBarPoint } from "@/components/dashboard/Charts";

const Charts = {
  BarrasMetaFat: lazy(() => import("@/components/dashboard/Charts").then((m) => ({ default: m.BarrasMetaFat }))),
  BarrasVendedor: lazy(() => import("@/components/dashboard/Charts").then((m) => ({ default: m.BarrasVendedor }))),
  PizzaLucro: lazy(() => import("@/components/dashboard/Charts").then((m) => ({ default: m.PizzaLucro }))),
  LinhaTrimestral: lazy(() => import("@/components/dashboard/Charts").then((m) => ({ default: m.LinhaTrimestral }))),
};

const Fallback = () => <Skeleton className="h-[320px] w-full" />;

export const BarrasLazy = (p: { data: BarPoint[] }) => (
  <Suspense fallback={<Fallback />}><Charts.BarrasMetaFat {...p} /></Suspense>
);
export const BarrasVendedorLazy = (p: { data: VendedorBarPoint[] }) => (
  <Suspense fallback={<Fallback />}><Charts.BarrasVendedor {...p} /></Suspense>
);
export const PizzaLazy = (p: { data: PiePoint[] }) => (
  <Suspense fallback={<Fallback />}><Charts.PizzaLucro {...p} /></Suspense>
);
export const LinhaLazy = (p: { data: LinePoint[] }) => (
  <Suspense fallback={<Fallback />}><Charts.LinhaTrimestral {...p} /></Suspense>
);

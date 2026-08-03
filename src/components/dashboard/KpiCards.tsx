// src/components/dashboard/KpiCards.tsx
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { brl, pct } from "@/lib/formato";
import { semaforo } from "@/lib/formato";
import type { KPIsFinanceiro } from "@/lib/financeiro";

const cor = { verde: "before:bg-pasto-escuro", amarelo: "before:bg-pasto-amarelo", vermelho: "before:bg-[#d0342c]" };
const txt = { verde: "text-pasto-escuro", amarelo: "text-[#8a6d00]", vermelho: "text-[#d0342c]" };

const Card = ({ titulo, valor, sub, sem, loading }: { titulo: string; valor: string; sub?: string; sem?: "verde" | "amarelo" | "vermelho"; loading?: boolean }) => (
  <div className={`relative overflow-hidden rounded-2xl border border-border bg-white p-4 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 ${sem ? cor[sem] : "before:bg-pasto-escuro"}`}>
    <div className="text-xs font-semibold text-[#5c6a50]">{titulo}</div>
    {loading ? <Skeleton className="h-7 w-24 mt-2" /> : <div className={`text-xl font-extrabold mt-1.5 ${sem ? txt[sem] : ""}`}>{valor}</div>}
    {sub && !loading && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
  </div>
);

export const KpiCards = React.memo(function KpiCards({ k, loading }: { k: KPIsFinanceiro; loading: boolean }) {
  const semAtg = semaforo(k.atingimento);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <Card loading={loading} titulo="Faturamento Realizado" valor={brl(k.faturamento)} sub={`Meta: ${brl(k.meta)}`} sem={semAtg} />
      <Card loading={loading} titulo="Meta do período" valor={brl(k.meta)} />
      <Card loading={loading} titulo="Atingimento" valor={pct(k.atingimento)} sem={semAtg} />
      <Card loading={loading} titulo="Lucro Bruto" valor={brl(k.lucroBruto)} sub={`Margem ${pct(k.margemBruta)}`} />
      <Card loading={loading} titulo="Margem Bruta" valor={pct(k.margemBruta)} />
      <Card loading={loading} titulo="CMV" valor={brl(k.cmv)} sub={`${pct(k.cmvPct)} da receita`} />
      <Card loading={loading} titulo="Despesas Gerais" valor={brl(k.despesas)} sub={`${pct(k.despesasPct)} da receita`} />
      <Card loading={loading} titulo="Lucro Líquido" valor={brl(k.lucroLiquido)} sub={`${pct(k.lucroLiquidoPct)} da receita`} sem={k.lucroLiquido < 0 ? "vermelho" : "verde"} />
    </div>
  );
});

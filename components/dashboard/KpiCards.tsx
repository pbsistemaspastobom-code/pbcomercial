// src/components/dashboard/KpiCards.tsx
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { brl, pct, semaforo } from "@/lib/formato";
import type { KPIsFinanceiro } from "@/lib/financeiro";

const txt = { verde: "text-primary", amarelo: "text-[#8a6d00]", vermelho: "text-[#d0342c]" };

const Card = ({ titulo, valor, sub, sem, destaque, loading }: { titulo: string; valor: string; sub?: string; sem?: "verde" | "amarelo" | "vermelho"; destaque?: boolean; loading?: boolean }) => (
  <div className="relative overflow-hidden card-soft p-5 transition-shadow hover:shadow-cardHover">
    {destaque && <span className="absolute left-0 right-0 top-0 h-1 bg-gold" />}
    <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">{titulo}</div>
    {loading ? <Skeleton className="h-8 w-28 mt-2" /> : <div className={`font-headline text-2xl font-bold mt-2 tnum ${sem ? txt[sem] : "text-primary"}`}>{valor}</div>}
    {sub && !loading && <div className="text-xs text-ink-mute mt-1.5 tnum">{sub}</div>}
  </div>
);

export const KpiCards = React.memo(function KpiCards({ k, loading }: { k: KPIsFinanceiro; loading: boolean }) {
  const semAtg = semaforo(k.atingimento);
  const bateuMeta = k.atingimento >= 100;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card loading={loading} titulo="Faturamento Realizado" valor={brl(k.faturamento)} sub={`Meta: ${brl(k.meta)}`} sem={semAtg} destaque={bateuMeta} />
      <Card loading={loading} titulo="Meta do período" valor={brl(k.meta)} />
      <Card loading={loading} titulo="Atingimento" valor={pct(k.atingimento)} sem={semAtg} destaque={bateuMeta} />
      <Card loading={loading} titulo="Lucro Bruto" valor={brl(k.lucroBruto)} sub={`Margem ${pct(k.margemBruta)}`} />
      <Card loading={loading} titulo="Margem Bruta" valor={pct(k.margemBruta)} />
      <Card loading={loading} titulo="CMV" valor={brl(k.cmv)} sub={`${pct(k.cmvPct)} da receita`} />
      <Card loading={loading} titulo="Despesas Gerais" valor={brl(k.despesas)} sub={`${pct(k.despesasPct)} da receita`} />
      <Card loading={loading} titulo="Lucro Líquido" valor={brl(k.lucroLiquido)} sub={`${pct(k.lucroLiquidoPct)} da receita`} sem={k.lucroLiquido < 0 ? "vermelho" : "verde"} />
    </div>
  );
});

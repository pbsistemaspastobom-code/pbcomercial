// src/lib/financeiro.ts
import { GRUPOS_DATA, FIN, type GrupoSerie } from "@/data/planejamento2026";

export interface KPIsFinanceiro {
  faturamento: number; meta: number; atingimento: number;
  lucroBruto: number; margemBruta: number; cmv: number; cmvPct: number;
  despesas: number; despesasPct: number; lucroLiquido: number; lucroLiquidoPct: number;
}
export interface GrupoAgregado {
  grupo: string; meta: number; realizado: number; margem: number; lucro: number;
  atingimento: number; contribuicaoLucro: number;
}

/** Agrega grupos para os meses selecionados. `series` permite passar dados do banco. */
export function agregarGrupos(meses: number[], series: GrupoSerie[] = GRUPOS_DATA): GrupoAgregado[] {
  const somaMes = (arr: number[]) => meses.reduce((s, m) => s + (arr[m - 1] ?? 0), 0);
  const base = series.map((g) => {
    const realizado = somaMes(g.realizado);
    const meta = somaMes(g.metas);
    return { grupo: g.grupo, meta, realizado, margem: g.margem, lucro: realizado * g.margem };
  });
  const lucroTotal = base.reduce((s, g) => s + g.lucro, 0) || 1;
  return base.map((g) => ({
    ...g,
    atingimento: g.meta > 0 ? (g.realizado / g.meta) * 100 : 0,
    contribuicaoLucro: (g.lucro / lucroTotal) * 100,
  }));
}

export function calcularKPIs(meses: number[], series: GrupoSerie[] = GRUPOS_DATA): KPIsFinanceiro {
  const grupos = agregarGrupos(meses, series);
  const faturamento = grupos.reduce((s, g) => s + g.realizado, 0);
  const meta = grupos.reduce((s, g) => s + g.meta, 0);
  const lucroBruto = grupos.reduce((s, g) => s + g.lucro, 0);
  const cmv = faturamento - lucroBruto;
  const despesas = faturamento * FIN.despesasGeraisPct;
  const lucroLiquido = lucroBruto - despesas;
  const p = (n: number) => (faturamento > 0 ? (n / faturamento) * 100 : 0);
  return {
    faturamento, meta, atingimento: meta > 0 ? (faturamento / meta) * 100 : 0,
    lucroBruto, margemBruta: p(lucroBruto), cmv, cmvPct: p(cmv),
    despesas, despesasPct: p(despesas), lucroLiquido, lucroLiquidoPct: p(lucroLiquido),
  };
}

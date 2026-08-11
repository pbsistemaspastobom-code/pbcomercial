// src/hooks/useResumoAnual.ts
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Row { codigo: string; mes: number; meta: number | null; venda_liquida: number | null; }
interface Cfg { codigo: string; setor: string | null; }

export interface ResumoAnual {
  porMes: { mes: number; meta: number; venda: number }[];
  porSetor: { setor: string; venda: number }[];
  isLoading: boolean;
}

export function useResumoAnual(ano: number): ResumoAnual {
  const query = useQuery({
    queryKey: ["resumo-anual", ano],
    queryFn: async ({ signal }) => {
      const [vendas, cfg] = await Promise.all([
        supabase.from("metas_vendedores").select("codigo, mes, meta, venda_liquida").eq("ano", ano).abortSignal(signal as AbortSignal),
        supabase.from("vendedores_config").select("codigo, setor").abortSignal(signal as AbortSignal),
      ]);
      if (vendas.error) throw vendas.error;
      if (cfg.error) throw cfg.error;
      return { vendas: (vendas.data ?? []) as Row[], cfg: (cfg.data ?? []) as Cfg[] };
    },
    staleTime: 60_000, gcTime: 5 * 60_000, refetchOnWindowFocus: false, retry: 1,
  });

  return useMemo(() => {
    const rows = query.data?.vendas ?? [];
    const setorDe: Record<string, string> = {};
    for (const c of query.data?.cfg ?? []) setorDe[c.codigo] = c.setor || "Outros";

    const porMes = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, meta: 0, venda: 0 }));
    const setorMap: Record<string, number> = {};
    for (const r of rows) {
      const m = porMes[(r.mes ?? 1) - 1];
      if (m) { m.meta += Number(r.meta) || 0; m.venda += Number(r.venda_liquida) || 0; }
      const setor = setorDe[r.codigo] || "Outros";
      setorMap[setor] = (setorMap[setor] ?? 0) + (Number(r.venda_liquida) || 0);
    }
    const porSetor = Object.entries(setorMap).filter(([, v]) => v > 0).map(([setor, venda]) => ({ setor, venda })).sort((a, b) => b.venda - a.venda);
    return { porMes, porSetor, isLoading: query.isLoading };
  }, [query.data, query.isLoading]);
}

// src/hooks/useTrimestralData.ts
import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Row { codigo: string; trimestre: number; meta: number | null; venda_liquida: number | null; }
interface Cfg { codigo: string; nome: string | null; setor: string | null; ativo: boolean | null; }

export interface LinhaTri { codigo: string; nome: string; setor: string; meta: number; venda: number; atingimento: number; }

export function useTrimestralData(ano: number) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["trimestral", ano],
    queryFn: async ({ signal }) => {
      const [dados, cfg] = await Promise.all([
        supabase.from("trimestral_dados").select("codigo, trimestre, meta, venda_liquida").eq("ano", ano).abortSignal(signal as AbortSignal),
        supabase.from("vendedores_config").select("codigo, nome, setor, ativo").abortSignal(signal as AbortSignal),
      ]);
      if (dados.error) throw dados.error;
      if (cfg.error) throw cfg.error;
      return { dados: (dados.data ?? []) as Row[], cfg: (cfg.data ?? []) as Cfg[] };
    },
    staleTime: 60_000, gcTime: 5 * 60_000, refetchOnWindowFocus: false, retry: 1,
  });

  const cfgMap = useMemo(() => {
    const m: Record<string, { nome: string; setor: string; ativo: boolean }> = {};
    for (const c of query.data?.cfg ?? []) if (c.codigo) m[c.codigo] = { nome: c.nome || c.codigo, setor: c.setor || "Outros", ativo: c.ativo ?? true };
    return m;
  }, [query.data]);

  // valores por trimestre e vendedor
  const mapa = useMemo(() => {
    const m: Record<number, Record<string, { meta: number; venda: number }>> = { 1: {}, 2: {}, 3: {}, 4: {} };
    for (const r of query.data?.dados ?? []) {
      const t = r.trimestre ?? 1;
      (m[t] ??= {})[r.codigo] = { meta: Number(r.meta) || 0, venda: Number(r.venda_liquida) || 0 };
    }
    return m;
  }, [query.data]);

  const linhas = useCallback((tri: number): LinhaTri[] => {
    const codes = new Set<string>([...Object.keys(cfgMap), ...Object.keys(mapa[tri] ?? {})]);
    return [...codes].filter((c) => cfgMap[c]?.ativo ?? true).map((codigo) => {
      const d = mapa[tri]?.[codigo] ?? { meta: 0, venda: 0 };
      const info = cfgMap[codigo] ?? { nome: codigo, setor: "Outros" };
      return { codigo, nome: info.nome, setor: info.setor, meta: d.meta, venda: d.venda, atingimento: d.meta > 0 ? (d.venda / d.meta) * 100 : 0 };
    }).sort((a, b) => b.venda - a.venda);
  }, [cfgMap, mapa]);

  const porTri = useMemo(() => [1, 2, 3, 4].map((t) => {
    const vals = Object.values(mapa[t] ?? {});
    const meta = vals.reduce((s, v) => s + v.meta, 0);
    const venda = vals.reduce((s, v) => s + v.venda, 0);
    return { tri: t, nome: `Q${t}`, meta, venda, atingimento: meta > 0 ? (venda / meta) * 100 : 0 };
  }), [mapa]);

  const invalidar = useCallback(() => qc.invalidateQueries({ queryKey: ["trimestral"] }), [qc]);
  useEffect(() => {
    const h = () => qc.invalidateQueries({ queryKey: ["trimestral"] });
    window.addEventListener("trimestral-changed", h);
    return () => window.removeEventListener("trimestral-changed", h);
  }, [qc]);

  return { porTri, linhas, isLoading: query.isLoading, invalidar };
}

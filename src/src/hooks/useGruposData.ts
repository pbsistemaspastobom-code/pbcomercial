// src/hooks/useGruposData.ts
import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GRUPOS_DATA, type GrupoSerie } from "@/data/planejamento2026";

interface GrupoRow { grupo: string; mes: number; meta: number | null; realizado: number | null; }

async function fetchGrupos(ano: number, signal?: AbortSignal): Promise<GrupoRow[]> {
  const { data, error } = await supabase
    .from("grupos_financeiro").select("grupo, mes, meta, realizado")
    .eq("ano", ano).abortSignal(signal as AbortSignal);
  if (error) throw error;
  return (data ?? []) as GrupoRow[];
}

/** Séries de grupos: default estático sobrescrito pelos valores do banco (por grupo e mês). */
export function useGruposData(ano: number) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["grupos", ano],
    queryFn: ({ signal }) => fetchGrupos(ano, signal),
    staleTime: 60_000, gcTime: 5 * 60_000, refetchOnWindowFocus: false, retry: 1,
  });

  const series = useMemo<GrupoSerie[]>(() => {
    const db: Record<string, Record<number, { meta?: number; realizado?: number }>> = {};
    for (const r of query.data ?? []) {
      (db[r.grupo] ??= {})[r.mes] = { meta: r.meta ?? undefined, realizado: r.realizado ?? undefined };
    }
    return GRUPOS_DATA.map((g) => {
      const over = db[g.grupo] ?? {};
      const metas = g.metas.map((v, i) => over[i + 1]?.meta ?? v);
      const realizado = g.realizado.map((v, i) => over[i + 1]?.realizado ?? v);
      return { ...g, metas, realizado };
    });
  }, [query.data]);

  const invalidar = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["grupos"] });
  }, [queryClient]);

  useEffect(() => {
    const h = () => queryClient.invalidateQueries({ queryKey: ["grupos"] });
    window.addEventListener("grupos-data-changed", h);
    return () => window.removeEventListener("grupos-data-changed", h);
  }, [queryClient]);

  return { series, isLoading: query.isLoading, invalidar };
}

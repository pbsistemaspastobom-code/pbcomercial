// src/hooks/useMetasData.ts
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VENDEDORES, PLANO_POR_CODIGO, type Setor } from "@/data/planejamento2026";
import { diasUteisAgregado } from "@/lib/diasUteis";

export interface VendedorEfetivo { codigo: string; nome: string; setor: Setor; ativo: boolean; }
export interface LinhaVendedor {
  codigo: string; nome: string; setor: Setor; ativo: boolean;
  meta: number; vendaLiquida: number; atingimento: number;
  faltaMeta: number; mediaDiaUtil: number; ritmoNecessario: number;
  projecao: number; projecaoPct: number;
}
interface HistRow { codigo: string; mes: number; venda_liquida: number | null; }
interface ConfigRow { codigo: string; nome: string | null; setor: string | null; ativo: boolean | null; }

const TIMEOUT = 4000;

async function fetchVendas(ano: number, meses: number[], signal?: AbortSignal): Promise<HistRow[]> {
  const { data, error } = await supabase
    .from("metas_vendedores").select("codigo, mes, venda_liquida")
    .eq("ano", ano).in("mes", meses).abortSignal(signal as AbortSignal);
  if (error) throw error;
  return (data ?? []) as HistRow[];
}
async function fetchConfig(signal?: AbortSignal): Promise<ConfigRow[]> {
  const { data, error } = await supabase
    .from("vendedores_config").select("codigo, nome, setor, ativo").abortSignal(signal as AbortSignal);
  if (error) throw error;
  return (data ?? []) as ConfigRow[];
}

/** Lista efetiva de vendedores: estático + overrides/novos do banco. */
function mesclarVendedores(config: ConfigRow[]): VendedorEfetivo[] {
  const cfg: Record<string, ConfigRow> = {};
  for (const c of config) cfg[c.codigo] = c;
  const base: VendedorEfetivo[] = VENDEDORES.map((v) => {
    const c = cfg[v.codigo];
    return { codigo: v.codigo, nome: c?.nome || v.nome, setor: (c?.setor as Setor) || v.setor, ativo: c?.ativo ?? v.ativo };
  });
  const conhecidos = new Set(VENDEDORES.map((v) => v.codigo));
  for (const c of config) {
    if (!conhecidos.has(c.codigo)) base.push({ codigo: c.codigo, nome: c.nome || c.codigo, setor: (c.setor as Setor) || "Outros", ativo: c.ativo ?? true });
  }
  return base;
}

export function useMetasData(ano: number, meses: number[]) {
  const queryClient = useQueryClient();
  const mesesKey = [...meses].sort((a, b) => a - b).join(",");
  const reqId = useRef(0);

  const query = useQuery({
    queryKey: ["metas", ano, mesesKey],
    queryFn: async ({ signal }) => {
      const id = ++reqId.current;
      const withTimeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), TIMEOUT));
      const data = await Promise.race([Promise.all([fetchVendas(ano, meses, signal), fetchConfig(signal)]), withTimeout]);
      if (id !== reqId.current) return { vendas: [] as HistRow[], config: [] as ConfigRow[] };
      const [vendas, config] = data as [HistRow[], ConfigRow[]];
      return { vendas, config };
    },
    staleTime: 60_000, gcTime: 5 * 60_000, refetchOnWindowFocus: false, retry: 1,
  });

  const dias = useMemo(() => diasUteisAgregado(ano, meses), [ano, mesesKey]);

  const todos = useMemo<VendedorEfetivo[]>(() => mesclarVendedores(query.data?.config ?? []), [query.data]);

  const linhas = useMemo<LinhaVendedor[]>(() => {
    const vl: Record<string, number> = {};
    for (const r of query.data?.vendas ?? []) vl[r.codigo] = (vl[r.codigo] ?? 0) + (Number(r.venda_liquida) || 0);

    return todos.filter((v) => v.ativo).map((v) => {
      const meta = meses.reduce((s, m) => s + (PLANO_POR_CODIGO[v.codigo]?.metas[m - 1] ?? 0), 0);
      const vendaLiquida = vl[v.codigo] ?? 0;
      const atingimento = meta > 0 ? (vendaLiquida / meta) * 100 : 0;
      const faltaMeta = Math.max(meta - vendaLiquida, 0);
      const mediaDiaUtil = dias.passados > 0 ? vendaLiquida / dias.passados : 0;
      const ritmoNecessario = dias.restantes > 0 ? faltaMeta / dias.restantes : 0;
      const projecao = dias.passados > 0 ? (vendaLiquida / dias.passados) * dias.totais : 0;
      const projecaoPct = meta > 0 ? (projecao / meta) * 100 : 0;
      return { codigo: v.codigo, nome: v.nome, setor: v.setor, ativo: v.ativo, meta, vendaLiquida, atingimento, faltaMeta, mediaDiaUtil, ritmoNecessario, projecao, projecaoPct };
    });
  }, [query.data, mesesKey, dias, todos]);

  const invalidar = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["metas"] });
    window.dispatchEvent(new CustomEvent("metas-data-changed"));
  }, [queryClient]);

  useEffect(() => {
    const h = () => queryClient.invalidateQueries({ queryKey: ["metas"] });
    window.addEventListener("metas-data-changed", h);
    return () => window.removeEventListener("metas-data-changed", h);
  }, [queryClient]);

  return { linhas, todos, dias, isLoading: query.isLoading, error: query.error as Error | null, invalidar };
}

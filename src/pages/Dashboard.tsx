// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/dashboard/Header";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { BarrasLazy, PizzaLazy } from "@/components/dashboard/ChartsLazy";
import { FaturamentoGrupoTable } from "@/components/dashboard/FaturamentoGrupoTable";
import { MetasVendedorTab } from "@/components/dashboard/MetasVendedorTab";
import { TrimestralTab } from "@/components/dashboard/TrimestralTab";
import { useMetasData } from "@/hooks/useMetasData";
import { useGruposData } from "@/hooks/useGruposData";
import { calcularKPIs, agregarGrupos } from "@/lib/financeiro";
import { GRUPOS_DATA } from "@/data/planejamento2026";
import { brl, pct, MESES, MESES_LONGO } from "@/lib/formato";
import { EditarGruposModal } from "@/components/dashboard/EditarGruposModal";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const ano = 2026;
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);
  const [mesesSel, setMesesSel] = useState<number[]>([new Date().getMonth() + 1]);
  const [visao, setVisao] = useState<"mensal" | "anual">("mensal");

  const meses = useMemo(() => (visao === "anual" ? Array.from({ length: 12 }, (_, i) => i + 1) : mesesSel), [visao, mesesSel]);
  const multiMes = meses.length > 1;

  const { linhas, todos, dias, isLoading, invalidar } = useMetasData(ano, meses);
  const { series: gruposSeries, invalidar: invalidarGrupos } = useGruposData(ano);
  const kpis = useMemo(() => calcularKPIs(meses, gruposSeries), [meses, gruposSeries]);

  // limpeza automática de cache a cada 10 min em requestIdleCallback (item 9)
  useEffect(() => {
    const ric: (cb: () => void) => number =
      (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback ||
      ((cb) => window.setTimeout(cb, 0));
    const id = window.setInterval(() => ric(() => queryClient.invalidateQueries()), 10 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [queryClient]);

  const periodoLabel = useMemo(() => {
    if (visao === "anual") return `ACUMULADO ${ano}`;
    if (meses.length === 1) return `${MESES_LONGO[meses[0] - 1].toUpperCase()} ${ano}`;
    return `${meses.map((m) => MESES[m - 1].toUpperCase()).join(" + ")} ${ano}`;
  }, [visao, meses, ano]);

  // gráfico de barras: por mês (anual) ou por grupo (mensal)
  const barData = useMemo(() => {
    if (visao === "anual") {
      return MESES.map((m, i) => ({
        label: m,
        Meta: gruposSeries.reduce((s, g) => s + g.metas[i], 0),
        Faturamento: gruposSeries.reduce((s, g) => s + g.realizado[i], 0),
      }));
    }
    return agregarGrupos(meses, gruposSeries).map((g) => ({ label: g.grupo, Meta: g.meta, Faturamento: g.realizado }));
  }, [visao, meses, gruposSeries]);

  const pieData = useMemo(() => agregarGrupos(meses, gruposSeries).map((g) => ({ name: g.grupo, value: g.lucro })), [meses, gruposSeries]);

  const setMes = (m: number) => { setMesAtual(m); setMesesSel([m]); if (visao === "anual") setVisao("mensal"); };

  // resumo equipe + destaque
  const resumo = useMemo(() => {
    const acima = linhas.filter((l) => l.atingimento >= 100).length;
    const abaixo = linhas.filter((l) => l.atingimento < 100).length;
    const totMeta = linhas.reduce((s, l) => s + l.meta, 0);
    const totVl = linhas.reduce((s, l) => s + l.vendaLiquida, 0);
    return { total: linhas.length, acima, abaixo, atg: totMeta > 0 ? (totVl / totMeta) * 100 : 0 };
  }, [linhas]);
  const abaixoMeta = useMemo(() => linhas.filter((l) => l.atingimento < 100).sort((a, b) => a.atingimento - b.atingimento), [linhas]);

  return (
    <div className="max-w-[1300px] mx-auto px-6 py-6">
      <Header ano={ano} mes={mesAtual} onMes={setMes} visao={visao} onVisao={setVisao} periodoLabel={periodoLabel} />

      <TabsWrapper
        ano={ano} meses={meses} multiMes={multiMes} linhas={linhas} loading={isLoading}
        invalidar={invalidar} onMeses={setMesesSel} kpis={kpis} barData={barData} pieData={pieData}
        resumo={resumo} abaixoMeta={abaixoMeta} dias={dias} todos={todos}
        series={gruposSeries} invalidarGrupos={invalidarGrupos} mes={mesAtual}
      />
    </div>
  );
}

// Componente de abas separado para manter o Dashboard enxuto
function TabsWrapper(props: {
  ano: number; meses: number[]; multiMes: boolean; linhas: ReturnType<typeof useMetasData>["linhas"];
  loading: boolean; invalidar: () => void; onMeses: (m: number[]) => void;
  kpis: ReturnType<typeof calcularKPIs>; barData: { label: string; Meta: number; Faturamento: number }[];
  pieData: { name: string; value: number }[]; resumo: { total: number; acima: number; abaixo: number; atg: number };
  abaixoMeta: ReturnType<typeof useMetasData>["linhas"];
  dias: ReturnType<typeof useMetasData>["dias"];
  todos: ReturnType<typeof useMetasData>["todos"];
  series: ReturnType<typeof useGruposData>["series"];
  invalidarGrupos: () => void;
  mes: number;
}) {
  const [tab, setTab] = useState("visao");
  const [editarGrupos, setEditarGrupos] = useState(false);
  const { ano, meses, multiMes, linhas, loading, invalidar, onMeses, kpis, barData, pieData, resumo, abaixoMeta, dias, todos, series, invalidarGrupos, mes } = props;

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="mb-2">
        <TabsTrigger value="visao">Visão Geral</TabsTrigger>
        <TabsTrigger value="vendedores">Metas por Vendedor</TabsTrigger>
        <TabsTrigger value="trimestral">Trimestral</TabsTrigger>
      </TabsList>

      <TabsContent value="visao">
        <KpiCards k={kpis} loading={loading} />
        <div className="grid lg:grid-cols-2 gap-4 mb-5">
          <div className="rounded-2xl border border-border bg-white p-5">
            <h3 className="text-pasto-escuro font-semibold mb-3">Meta vs Faturamento</h3>
            <BarrasLazy data={barData} />
          </div>
          <div className="rounded-2xl border border-border bg-white p-5">
            <h3 className="text-pasto-escuro font-semibold mb-3">Lucro por grupo</h3>
            <PizzaLazy data={pieData} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-pasto-escuro font-semibold">Faturamento por grupo (12 meses)</h3>
            <Button variant="outline" size="sm" onClick={() => setEditarGrupos(true)}>Editar Grupos</Button>
          </div>
          <FaturamentoGrupoTable series={series} />
        </div>

        {abaixoMeta.length > 0 && (
          <div className="rounded-2xl border border-[#f5cfca] bg-[#fff5f4] p-5 mb-5">
            <h3 className="text-[#b12318] font-semibold mb-3">⚠️ Vendedores abaixo da meta ({abaixoMeta.length})</h3>
            <div className="divide-y divide-[#f0d5d1]">
              {abaixoMeta.map((l) => (
                <div key={l.codigo} className="flex justify-between py-1.5 text-sm">
                  <span>{l.nome} <span className="text-xs text-muted-foreground">· {l.setor}</span></span>
                  <span><strong className="text-[#b12318]">{pct(l.atingimento)}</strong> · falta {brl(l.faltaMeta)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-white p-5">
          <h3 className="text-pasto-escuro font-semibold mb-3">Resumo geral da equipe</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div><div className="text-2xl font-extrabold text-pasto-escuro">{resumo.total}</div><div className="text-xs text-muted-foreground">Vendedores ativos</div></div>
            <div><div className="text-2xl font-extrabold text-pasto-escuro">{resumo.acima}</div><div className="text-xs text-muted-foreground">Acima da meta</div></div>
            <div><div className="text-2xl font-extrabold text-[#d0342c]">{resumo.abaixo}</div><div className="text-xs text-muted-foreground">Abaixo da meta</div></div>
            <div><div className="text-2xl font-extrabold text-pasto-escuro">{pct(resumo.atg)}</div><div className="text-xs text-muted-foreground">Atingimento da equipe</div></div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="vendedores">
        <MetasVendedorTab linhas={linhas} ano={ano} meses={meses} multiMes={multiMes} onMeses={onMeses} invalidar={invalidar} loading={loading} dias={dias} todos={todos} />
      </TabsContent>

      <TabsContent value="trimestral">
        <TrimestralTab ano={ano} />
      </TabsContent>

      <EditarGruposModal open={editarGrupos} onOpenChange={setEditarGrupos} ano={ano} mes={mes} series={series} onSaved={invalidarGrupos} />
    </Tabs>
  );
}

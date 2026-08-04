// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AppShell, type NavKey } from "@/components/layout/AppShell";
import { Header } from "@/components/dashboard/Header";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { BarrasLazy, PizzaLazy } from "@/components/dashboard/ChartsLazy";
import { FaturamentoGrupoTable } from "@/components/dashboard/FaturamentoGrupoTable";
import { MetasVendedorTab } from "@/components/dashboard/MetasVendedorTab";
import { TrimestralTab } from "@/components/dashboard/TrimestralTab";
import { GerenciarEquipeModal } from "@/components/dashboard/GerenciarEquipeModal";
import { EditarGruposModal } from "@/components/dashboard/EditarGruposModal";
import { useMetasData } from "@/hooks/useMetasData";
import { useGruposData } from "@/hooks/useGruposData";
import { calcularKPIs, agregarGrupos } from "@/lib/financeiro";
import { brl, pct, MESES, MESES_LONGO } from "@/lib/formato";
import { Users } from "lucide-react";

const TITULOS: Record<NavKey, { t: string; s: string }> = {
  dashboard: { t: "Painel Geral", s: "Indicadores comerciais e financeiros" },
  metas: { t: "Metas por Vendedor", s: "Acompanhamento individual e por setor" },
  relatorios: { t: "Relatórios", s: "Consolidado trimestral e anual" },
  equipe: { t: "Gerenciar Equipe", s: "Vendedores, setores e cadastro" },
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const ano = 2026;
  const [nav, setNav] = useState<NavKey>("dashboard");
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);
  const [mesesSel, setMesesSel] = useState<number[]>([new Date().getMonth() + 1]);
  const [visao, setVisao] = useState<"mensal" | "anual">("mensal");
  const [editarGrupos, setEditarGrupos] = useState(false);
  const [gerenciar, setGerenciar] = useState(false);

  const meses = useMemo(() => (visao === "anual" ? Array.from({ length: 12 }, (_, i) => i + 1) : mesesSel), [visao, mesesSel]);
  const multiMes = meses.length > 1;

  const { linhas, todos, dias, isLoading, invalidar } = useMetasData(ano, meses);
  const { series: gruposSeries, invalidar: invalidarGrupos } = useGruposData(ano);
  const kpis = useMemo(() => calcularKPIs(meses, gruposSeries), [meses, gruposSeries]);

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

  const barData = useMemo(() => {
    if (visao === "anual") {
      return MESES.map((m, i) => ({ label: m, Meta: gruposSeries.reduce((s, g) => s + g.metas[i], 0), Faturamento: gruposSeries.reduce((s, g) => s + g.realizado[i], 0) }));
    }
    return agregarGrupos(meses, gruposSeries).map((g) => ({ label: g.grupo, Meta: g.meta, Faturamento: g.realizado }));
  }, [visao, meses, gruposSeries]);
  const pieData = useMemo(() => agregarGrupos(meses, gruposSeries).map((g) => ({ name: g.grupo, value: g.lucro })), [meses, gruposSeries]);

  const setMes = (m: number) => { setMesAtual(m); setMesesSel([m]); if (visao === "anual") setVisao("mensal"); };

  const resumo = useMemo(() => {
    const acima = linhas.filter((l) => l.atingimento >= 100).length;
    const abaixo = linhas.filter((l) => l.atingimento < 100).length;
    const totMeta = linhas.reduce((s, l) => s + l.meta, 0);
    const totVl = linhas.reduce((s, l) => s + l.vendaLiquida, 0);
    return { total: linhas.length, acima, abaixo, atg: totMeta > 0 ? (totVl / totMeta) * 100 : 0 };
  }, [linhas]);
  const abaixoMeta = useMemo(() => linhas.filter((l) => l.atingimento < 100).sort((a, b) => a.atingimento - b.atingimento), [linhas]);

  const cardCls = "card-soft p-5";
  const h3 = "font-headline text-lg font-semibold text-primary mb-3";

  const actions = nav === "equipe"
    ? <Button onClick={() => setGerenciar(true)} className="bg-primary hover:bg-primary-dark text-white"><Users className="w-4 h-4" /> Gerenciar Equipe</Button>
    : (nav === "dashboard" || nav === "metas")
      ? <Header ano={ano} mes={mesAtual} onMes={setMes} visao={visao} onVisao={setVisao} periodoLabel={periodoLabel} />
      : undefined;

  return (
    <AppShell active={nav} onNavigate={setNav} title={TITULOS[nav].t} subtitle={TITULOS[nav].s} actions={actions}>
      {nav === "dashboard" && (
        <>
          <KpiCards k={kpis} loading={isLoading} />
          <div className="grid lg:grid-cols-2 gap-4 mb-5">
            <div className={cardCls}><h3 className={h3}>Meta vs Faturamento</h3><BarrasLazy data={barData} /></div>
            <div className={cardCls}><h3 className={h3}>Lucro por grupo</h3><PizzaLazy data={pieData} /></div>
          </div>
          <div className={`${cardCls} mb-5`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`${h3} mb-0`}>Faturamento por grupo (12 meses)</h3>
              <Button variant="outline" size="sm" onClick={() => setEditarGrupos(true)}>Editar Grupos</Button>
            </div>
            <FaturamentoGrupoTable series={gruposSeries} />
          </div>
          {abaixoMeta.length > 0 && (
            <div className="rounded-xl border border-[#f5cfca] bg-[#fff5f4] p-5 mb-5">
              <h3 className="font-headline text-lg font-semibold text-[#b12318] mb-3">Vendedores abaixo da meta ({abaixoMeta.length})</h3>
              <div className="divide-y divide-[#f0d5d1]">
                {abaixoMeta.map((l) => (
                  <div key={l.codigo} className="flex justify-between py-1.5 text-sm">
                    <span>{l.nome} <span className="text-xs text-ink-mute">· {l.setor}</span></span>
                    <span className="tnum"><strong className="text-[#b12318]">{pct(l.atingimento)}</strong> · falta {brl(l.faltaMeta)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className={cardCls}>
            <h3 className={h3}>Resumo geral da equipe</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div><div className="text-2xl font-extrabold text-primary tnum">{resumo.total}</div><div className="text-xs text-ink-mute">Vendedores ativos</div></div>
              <div><div className="text-2xl font-extrabold text-primary tnum">{resumo.acima}</div><div className="text-xs text-ink-mute">Acima da meta</div></div>
              <div><div className="text-2xl font-extrabold text-[#d0342c] tnum">{resumo.abaixo}</div><div className="text-xs text-ink-mute">Abaixo da meta</div></div>
              <div><div className="text-2xl font-extrabold text-primary tnum">{pct(resumo.atg)}</div><div className="text-xs text-ink-mute">Atingimento da equipe</div></div>
            </div>
          </div>
        </>
      )}

      {nav === "metas" && (
        <MetasVendedorTab linhas={linhas} ano={ano} meses={meses} multiMes={multiMes} onMeses={setMesesSel} invalidar={invalidar} loading={isLoading} dias={dias} todos={todos} />
      )}

      {nav === "relatorios" && <TrimestralTab ano={ano} />}

      {nav === "equipe" && (
        <div className={cardCls}>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-ink-mute text-left border-b border-[#e9ecef]">
                  <th className="py-2.5">Vendedor</th><th className="py-2.5">Setor</th><th className="py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {todos.map((v) => (
                  <tr key={v.codigo} className="border-b border-[#f1f3f4]">
                    <td className="py-3">{v.nome}<div className="text-xs text-ink-mute">Cód. {v.codigo}</div></td>
                    <td className="py-3">{v.setor}</td>
                    <td className="py-3 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${v.ativo ? "bg-[#e2f3e0] text-[#1f7a1a]" : "bg-[#eceeef] text-ink-mute"}`}>{v.ativo ? "ATIVO" : "INATIVO"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EditarGruposModal open={editarGrupos} onOpenChange={setEditarGrupos} ano={ano} mes={mesAtual} series={gruposSeries} onSaved={invalidarGrupos} />
      <GerenciarEquipeModal open={gerenciar} onOpenChange={setGerenciar} vendedores={todos} onSaved={invalidar} />
    </AppShell>
  );
}

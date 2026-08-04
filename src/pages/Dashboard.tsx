// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell, type NavKey } from "@/components/layout/AppShell";
import { Header } from "@/components/dashboard/Header";
import { MetasVendedorTab } from "@/components/dashboard/MetasVendedorTab";
import { TrimestralTab } from "@/components/dashboard/TrimestralTab";
import { GerenciarEquipeModal } from "@/components/dashboard/GerenciarEquipeModal";
import { useMetasData } from "@/hooks/useMetasData";
import { brl, pct, MESES, MESES_LONGO, semaforo } from "@/lib/formato";
import { Target, DollarSign, Percent, TrendingUp, Calendar, Clock, Users } from "lucide-react";

const TITULOS: Record<NavKey, { t: string; s: string }> = {
  dashboard: { t: "Painel Geral", s: "Visão anual consolidada — resultado 2026" },
  metas: { t: "Metas por Vendedor", s: "Acompanhamento individual e por setor" },
  relatorios: { t: "Relatórios", s: "Consolidado trimestral e anual" },
  equipe: { t: "Gerenciar Equipe", s: "Vendedores, setores e cadastro" },
};

const ANUAL = Array.from({ length: 12 }, (_, i) => i + 1);

// Farol (card KPI) no estilo do design
const cortxt = { verde: "text-primary", amarelo: "text-[#8a6d00]", vermelho: "text-[#d0342c]" };
function Farol({ icone, titulo, valor, cor, destaque, amarelo, loading }: { icone: React.ReactNode; titulo: string; valor: string; cor?: "verde" | "amarelo" | "vermelho"; destaque?: boolean; amarelo?: boolean; loading?: boolean }) {
  return (
    <div className="relative overflow-hidden card-soft p-5">
      {destaque && <span className="absolute left-0 right-0 top-0 h-1 bg-gold" />}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">{titulo}</span>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${amarelo ? "bg-[#fbf1c4] text-[#8a6d00]" : "bg-[#e8f1e5] text-primary"}`}>{icone}</span>
      </div>
      {loading ? <Skeleton className="h-8 w-28 mt-2" /> : <div className={`font-headline text-2xl font-bold mt-2 tnum ${cor ? cortxt[cor] : "text-primary"}`}>{valor}</div>}
    </div>
  );
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const ano = 2026;
  const [nav, setNav] = useState<NavKey>("dashboard");
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);
  const [mesesSel, setMesesSel] = useState<number[]>([new Date().getMonth() + 1]);
  const [visao, setVisao] = useState<"mensal" | "anual">("mensal");
  const [gerenciar, setGerenciar] = useState(false);

  const meses = useMemo(() => (visao === "anual" ? ANUAL : mesesSel), [visao, mesesSel]);
  const multiMes = meses.length > 1;

  // dados do período selecionado (aba Metas)
  const { linhas, todos, dias, isLoading, invalidar } = useMetasData(ano, meses);
  // dados anuais (Painel Geral) — sempre o ano inteiro, vindo do resultado importado
  const anual = useMetasData(ano, ANUAL);

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

  const setMes = (m: number) => { setMesAtual(m); setMesesSel([m]); if (visao === "anual") setVisao("mensal"); };

  // Painel Geral: 8 indicadores anuais, do resultado da planilha
  const painel = useMemo(() => {
    const meta = anual.linhas.reduce((s, l) => s + l.meta, 0);
    const venda = anual.linhas.reduce((s, l) => s + l.vendaLiquida, 0);
    const atingimento = meta > 0 ? (venda / meta) * 100 : 0;
    const projValor = anual.dias.passados > 0 ? (venda / anual.dias.passados) * anual.dias.totais : 0;
    const projMeta = meta > 0 ? (projValor / meta) * 100 : 0;
    return { meta, venda, atingimento, projValor, projMeta, dias: anual.dias };
  }, [anual.linhas, anual.dias]);

  const abaixoMeta = useMemo(
    () => anual.linhas.filter((l) => l.meta > 0 && l.atingimento < 100).sort((a, b) => a.atingimento - b.atingimento),
    [anual.linhas]
  );

  const actions = nav === "equipe"
    ? <Button onClick={() => setGerenciar(true)} className="bg-primary hover:bg-primary-dark text-white"><Users className="w-4 h-4" /> Gerenciar Equipe</Button>
    : nav === "metas"
      ? <Header ano={ano} mes={mesAtual} onMes={setMes} visao={visao} onVisao={setVisao} periodoLabel={periodoLabel} />
      : undefined;

  return (
    <AppShell active={nav} onNavigate={setNav} title={TITULOS[nav].t} subtitle={TITULOS[nav].s} actions={actions}>
      {nav === "dashboard" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            <Farol icone={<Target className="w-4 h-4" />} titulo="Meta Geral Anual" valor={brl(painel.meta)} loading={anual.isLoading} destaque={painel.atingimento >= 100} />
            <Farol icone={<DollarSign className="w-4 h-4" />} titulo="Venda Líquida Total" valor={brl(painel.venda)} loading={anual.isLoading} />
            <Farol icone={<Percent className="w-4 h-4" />} titulo="Atingimento" valor={pct(painel.atingimento)} cor={semaforo(painel.atingimento)} loading={anual.isLoading} />
            <Farol icone={<TrendingUp className="w-4 h-4" />} titulo="Projeção em Valor" valor={brl(painel.projValor)} loading={anual.isLoading} />
            <Farol icone={<Target className="w-4 h-4" />} titulo="Projeção de Meta %" valor={pct(painel.projMeta)} cor={semaforo(painel.projMeta)} loading={anual.isLoading} />
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-2xl">
            <Farol icone={<Calendar className="w-4 h-4" />} titulo="Total Dias Úteis (Ano)" valor={String(painel.dias.totais)} loading={anual.isLoading} />
            <Farol icone={<Clock className="w-4 h-4" />} titulo="Dias Passados" valor={String(painel.dias.passados)} loading={anual.isLoading} />
            <Farol icone={<TrendingUp className="w-4 h-4" />} titulo="Dias Restantes" valor={String(painel.dias.restantes)} amarelo loading={anual.isLoading} />
          </div>

          {abaixoMeta.length > 0 && (
            <div className="rounded-xl border border-[#f5cfca] bg-[#fff5f4] p-5 mt-6">
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
        </>
      )}

      {nav === "metas" && (
        <MetasVendedorTab linhas={linhas} ano={ano} meses={meses} multiMes={multiMes} onMeses={setMesesSel} invalidar={invalidar} loading={isLoading} dias={dias} todos={todos} />
      )}

      {nav === "relatorios" && <TrimestralTab ano={ano} />}

      {nav === "equipe" && (
        <div className="card-soft p-5">
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

      <GerenciarEquipeModal open={gerenciar} onOpenChange={setGerenciar} vendedores={todos} onSaved={invalidar} />
    </AppShell>
  );
}

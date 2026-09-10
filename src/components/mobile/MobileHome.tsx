// src/components/mobile/MobileHome.tsx — tela inicial estilo app, dados reais do sistema
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover } from "@/components/ui/popover";
import { brl, pct, MESES, MESES_LONGO, semaforo } from "@/lib/formato";
import type { LinhaVendedor } from "@/hooks/useMetasData";
import { Target, DollarSign, Percent, TrendingUp, Calendar, Clock, Sigma, Download, Search } from "lucide-react";

interface Painel { meta: number; venda: number; atingimento: number; projValor: number; projMeta: number; dias: { totais: number; passados: number; restantes: number } }
interface Props {
  periodoLabel: string;
  mesAtual: number; ano: number; visao: "mensal" | "anual";
  onMes: (m: number) => void; onVisao: (v: "mensal" | "anual") => void;
  meses: number[]; onMeses: (m: number[]) => void;
  painel: Painel; loading: boolean;
  linhas: LinhaVendedor[];
  tris: { tri: number; nome: string; meta: number; venda: number; atingimento: number }[];
  onVerVendedor?: (codigo: string) => void;
}

const KPI_BG = "bg-[#F1F5EF]"; const KPI_ICO = "text-primary";
const AMB_BG = "bg-[#FBF3D6]"; const AMB_ICO = "text-[#9A7A00]";

function Kpi({ icone, titulo, valor, caption, cor, amber, iconAmber }: { icone: React.ReactNode; titulo: string; valor: string; caption?: string; cor?: "verde" | "amarelo" | "vermelho"; amber?: boolean; iconAmber?: boolean }) {
  const corTexto = cor === "verde" ? "text-primary" : cor === "amarelo" || cor === "vermelho" ? "text-[#9A7A00]" : "text-ink";
  return (
    <div className="rounded-2xl bg-white border border-[#E9ECEF] p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wide text-ink-mute">{titulo}</span>
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconAmber ?? amber ? `${AMB_BG} ${AMB_ICO}` : `${KPI_BG} ${KPI_ICO}`}`}>{icone}</span>
      </div>
      <div className={`font-headline text-xl font-extrabold tnum ${corTexto}`}>{valor}</div>
      {caption && <div className="text-[11px] text-ink-mute mt-0.5">{caption}</div>}
    </div>
  );
}

const STATUS = {
  verde: { label: "No Prazo", bg: "bg-[#D6EDD3]", text: "text-primary-dark", bar: "bg-primary" },
  amarelo: { label: "Atenção", bg: "bg-[#FBF3D6]", text: "text-[#9A7A00]", bar: "bg-gold" },
  vermelho: { label: "Necessita Ação", bg: "bg-[#FBF3D6]", text: "text-[#9A7A00]", bar: "bg-[#9A7A00]" },
};

function VendedorCard({ l, onVer }: { l: LinhaVendedor; onVer?: (codigo: string) => void }) {
  const sem = semaforo(l.atingimento);
  const st = STATUS[sem];
  const iniciais = l.nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  const pctBar = Math.min(l.atingimento, 100);
  return (
    <div className="rounded-2xl bg-white border border-[#E9ECEF] p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#F1F5EF] text-primary-dark font-bold text-xs flex items-center justify-center shrink-0">{iniciais}</div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-ink truncate">{l.nome}</div>
            <div className="text-[11px] text-ink-mute truncate">{l.setor}</div>
          </div>
        </div>
        <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-ink-mute mb-1">
        <span>REALIZADO / META</span>
        <span className={`font-headline text-base font-extrabold tnum ${st.text}`}>{pct(l.atingimento)}</span>
      </div>
      <div className="text-sm font-semibold text-ink tnum mb-2">{brl(l.vendaLiquida)} <span className="text-ink-mute font-normal">/ {brl(l.meta)}</span></div>
      <div className="h-2 rounded-full bg-[#EEF1EA] overflow-hidden mb-2">
        <div className={`h-full rounded-full ${st.bar}`} style={{ width: `${pctBar}%` }} />
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-ink-mute">{l.faltaMeta > 0 ? `Falta ${brl(l.faltaMeta)}` : "Meta batida"}</span>
        <button onClick={() => onVer?.(l.codigo)} className="font-bold text-primary">Ver detalhes →</button>
      </div>
    </div>
  );
}

export function MobileHome({ periodoLabel, mesAtual, ano, visao, onMes, onVisao, meses, onMeses, painel, loading, linhas, tris, onVerVendedor }: Props) {
  const queryClient = useQueryClient();
  const [aba, setAba] = useState<"geral" | "individuais">("geral");

  const rankedTop = useMemo(() => [...linhas].sort((a, b) => b.atingimento - a.atingimento).slice(0, 8), [linhas]);

  const toggleMes = (m: number) => onMeses(meses.includes(m) ? meses.filter((x) => x !== m) : [...meses, m]);

  const exportarPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Banner do período */}
      <div className="rounded-2xl bg-primary-dark text-white p-4">
        <div className="flex items-center gap-2 text-white/70 text-[11px] font-bold uppercase tracking-wide mb-1">
          <Calendar className="w-3.5 h-3.5" /> {periodoLabel}
        </div>
        <div className="font-headline text-lg font-extrabold">Planejamento Comercial</div>
        <div className="text-white/60 text-xs mt-0.5">Acompanhamento consolidado da equipe</div>
      </div>

      {/* Filtro: mês / anual / somar meses */}
      <div className="flex items-center gap-2">
        <Select value={String(mesAtual)} onValueChange={(v) => onMes(Number(v))}>
          <SelectTrigger className="flex-1 h-11 rounded-xl"><SelectValue placeholder="Mês" /></SelectTrigger>
          <SelectContent>
            {MESES_LONGO.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{`${m}/${ano}`}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="inline-flex rounded-xl border border-[#E3E8DF] overflow-hidden h-11 shrink-0">
          <button onClick={() => onVisao("mensal")} className={`px-3 h-full text-xs font-bold ${visao === "mensal" ? "bg-primary text-white" : "bg-white text-ink-soft"}`}>Mês</button>
          <button onClick={() => onVisao("anual")} className={`px-3 h-full text-xs font-bold ${visao === "anual" ? "bg-primary text-white" : "bg-white text-ink-soft"}`}>Ano</button>
        </div>
        <Popover trigger={<button className="h-11 w-11 rounded-xl border border-[#E3E8DF] bg-white flex items-center justify-center shrink-0"><Sigma className="w-[18px] h-[18px] text-ink-soft" /></button>} className="w-52">
          <div className="text-[11px] font-bold text-ink-mute uppercase mb-2">Somar meses</div>
          <div className="grid grid-cols-3 gap-1">
            {MESES.map((m, i) => (
              <label key={m} className="flex items-center gap-1 text-xs"><input type="checkbox" checked={meses.includes(i + 1)} onChange={() => toggleMes(i + 1)} />{m}</label>
            ))}
          </div>
        </Popover>
      </div>

      {/* Abas internas */}
      <div className="inline-flex rounded-full bg-[#F1F5EF] p-1 w-full">
        <button onClick={() => setAba("geral")} className={`flex-1 py-2 rounded-full text-xs font-bold ${aba === "geral" ? "bg-white text-primary-dark shadow-sm" : "text-ink-mute"}`}>Visão Geral</button>
        <button onClick={() => setAba("individuais")} className={`flex-1 py-2 rounded-full text-xs font-bold ${aba === "individuais" ? "bg-white text-primary-dark shadow-sm" : "text-ink-mute"}`}>Metas Individuais</button>
      </div>

      {aba === "geral" ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <Kpi icone={<Target className="w-4 h-4" />} titulo="Meta" valor={brl(painel.meta)} caption="Meta do período" />
            <Kpi icone={<DollarSign className="w-4 h-4" />} titulo="Venda Líquida" valor={brl(painel.venda)} caption="Realizado no período" />
            <Kpi icone={<Percent className="w-4 h-4" />} titulo="% Atingimento" valor={pct(painel.atingimento)} cor={semaforo(painel.atingimento)} caption="Meta vs realizado" />
            <Kpi icone={<TrendingUp className="w-4 h-4" />} titulo="Projeção Valor" valor={brl(painel.projValor)} caption="Tendência linear" />
            <Kpi icone={<Target className="w-4 h-4" />} titulo="Projeção Meta" valor={pct(painel.projMeta)} cor={semaforo(painel.projMeta)} caption={`Gap de ${pct(Math.max(100 - painel.projMeta, 0))}`} />
            <Kpi icone={<Calendar className="w-4 h-4" />} titulo="Dias Úteis" valor={String(painel.dias.totais)} caption="No período" />
            <Kpi icone={<Clock className="w-4 h-4" />} titulo="Dias Passados" valor={String(painel.dias.passados)} caption={`${painel.dias.totais > 0 ? Math.round((painel.dias.passados / painel.dias.totais) * 100) : 0}% do tempo`} />
            <Kpi icone={<TrendingUp className="w-4 h-4" />} titulo="Dias Restantes" valor={String(painel.dias.restantes)} amber caption="Ritmo necessário" />
          </div>

          {/* Ações */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { queryClient.invalidateQueries(); toast.success("Atualizando dados..."); }} className="rounded-xl bg-primary-dark text-white text-sm font-bold py-3 flex items-center justify-center gap-2"><Search className="w-4 h-4" /> Atualizar Dados</button>
            <button onClick={exportarPdf} className="rounded-xl bg-white border border-[#E3E8DF] text-ink text-sm font-bold py-3 flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Exportar PDF</button>
          </div>

          {/* Previsão trimestral */}
          <div className="rounded-2xl bg-white border border-[#E9ECEF] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-headline font-bold text-sm text-ink">Previsão Trimestral</div>
              <div className="font-headline font-extrabold text-primary tnum">{brl(tris.reduce((s, t) => s + t.venda, 0))}</div>
            </div>
            <div className="space-y-3">
              {tris.map((t) => {
                const p = Math.min(t.atingimento, 100);
                return (
                  <div key={t.tri}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-ink">{t.nome}</span>
                      <span className="text-ink-mute tnum">{brl(t.venda)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#EEF1EA] overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${p}%` }} />
                    </div>
                    <div className="text-[10px] text-ink-mute mt-0.5">Meta: {brl(t.meta)} · {pct(t.atingimento)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-ink-mute font-semibold">{linhas.length} vendedor(es) no período</div>
          {rankedTop.map((l) => <VendedorCard key={l.codigo} l={l} onVer={onVerVendedor} />)}
          {!linhas.length && !loading && <div className="text-center text-ink-mute text-sm py-10">Nenhum vendedor com dados neste período.</div>}
        </div>
      )}
    </div>
  );
}

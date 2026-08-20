// src/components/dashboard/MetasVendedorTab.tsx
import React, { useCallback, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Upload, Undo2, History, Sigma, Users, Download, EyeOff, Eye, Target, DollarSign, Percent, TrendingUp, Calendar, Clock, Trash2 } from "lucide-react";
import { brl2, pct, MESES, MESES_LONGO, primeiroNome, semaforo } from "@/lib/formato";
import { BarrasVendedorLazy, PizzaLazy } from "@/components/dashboard/ChartsLazy";
import { SETORES } from "@/data/planejamento2026";
import { importarPlanilha, type ResultadoImport } from "@/lib/importVendas";
import { ImportarDialog } from "@/components/dashboard/ImportarDialog";
import { GerenciarEquipeModal } from "@/components/dashboard/GerenciarEquipeModal";
import type { LinhaVendedor, VendedorEfetivo } from "@/hooks/useMetasData";

const semCor = { verde: "bg-[#e2f3e0] text-[#1f7a1a]", amarelo: "bg-[#fbf1c4] text-[#8a6d00]", vermelho: "bg-[#fbe0dd] text-[#b12318]" };

const farolTxt = { verde: "text-pasto-escuro", amarelo: "text-[#8a6d00]", vermelho: "text-[#d0342c]" };
const Farol = ({ icone, titulo, valor, cor, amarelo, loading }: { icone: React.ReactNode; titulo: string; valor: string; cor?: "verde" | "amarelo" | "vermelho"; amarelo?: boolean; loading?: boolean }) => (
  <div className="rounded-2xl border border-border bg-white p-4">
    <div className="flex items-center justify-between text-[#5c6a50]">
      <span className="text-xs font-semibold">{titulo}</span>
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${amarelo ? "bg-[#fbf1c4] text-[#8a6d00]" : "bg-pasto-claro text-pasto-escuro"}`}>{icone}</span>
    </div>
    {loading ? <div className="h-6 w-20 mt-2 rounded bg-[#e6eae1] animate-pulse" /> : <div className={`text-lg font-extrabold mt-1.5 ${cor ? farolTxt[cor] : ""}`}>{valor}</div>}
  </div>
);

interface Props {
  linhas: LinhaVendedor[];
  ano: number;
  meses: number[];
  multiMes: boolean;
  onMeses: (m: number[]) => void;
  invalidar: () => void;
  loading: boolean;
  dias: { totais: number; passados: number; restantes: number };
  todos: VendedorEfetivo[];
}

export const MetasVendedorTab = React.memo(function MetasVendedorTab({ linhas, ano, meses, multiMes, onMeses, invalidar, loading, dias, todos }: Props) {
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [oculto, setOculto] = useState(false);
  const editRef = useRef<Record<string, number>>({}); // grava cada tecla, síncrono
  const [importResult, setImportResult] = useState<ResultadoImport | null>(null);
  const [gravandoImport, setGravandoImport] = useState(false);
  const [histAberto, setHistAberto] = useState(false);
  const [snapshots, setSnapshots] = useState<{ id: string; created_at: string; descricao: string | null }[]>([]);
  const [filtroVendedor, setFiltroVendedor] = useState("todos");
  const [gerenciarAberto, setGerenciarAberto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const money = (v: number) => (oculto ? "•••••" : brl2(v));

  // filtro por vendedor (afeta tabela e gráficos)
  const linhasFiltradas = useMemo(
    () => (filtroVendedor === "todos" ? linhas : linhas.filter((l) => l.codigo === filtroVendedor)),
    [linhas, filtroVendedor]
  );

  // agrupar por setor
  const porSetor = useMemo(() => {
    const g: Record<string, LinhaVendedor[]> = {};
    for (const l of linhasFiltradas) (g[l.setor] ??= []).push(l);
    return SETORES.map((s) => ({ setor: s, itens: (g[s] ?? []).sort((a, b) => b.vendaLiquida - a.vendaLiquida) })).filter((x) => x.itens.length);
  }, [linhasFiltradas]);

  const totalGeral = useMemo(() => ({
    meta: linhasFiltradas.reduce((s, l) => s + l.meta, 0),
    vl: linhasFiltradas.reduce((s, l) => s + l.vendaLiquida, 0),
  }), [linhasFiltradas]);

  // dados dos gráficos
  const barData = useMemo(
    () => [...linhasFiltradas].sort((a, b) => b.vendaLiquida - a.vendaLiquida).slice(0, 15)
      .map((l) => ({ label: primeiroNome(l.nome), Meta: l.meta, Venda: l.vendaLiquida })),
    [linhasFiltradas]
  );
  const umVendedor = linhasFiltradas.length === 1;
  const pieTitulo = umVendedor ? "Atingimento (Venda x Falta)" : "Distribuição de Metas";
  const pieData = useMemo(() => {
    if (umVendedor) {
      const l = linhasFiltradas[0];
      return [
        { name: "Venda Líquida", value: l.vendaLiquida },
        { name: "Ainda falta", value: Math.max(l.meta - l.vendaLiquida, 0) },
      ].filter((x) => x.value > 0);
    }
    return [...linhasFiltradas].filter((l) => l.meta > 0).sort((a, b) => b.meta - a.meta)
      .map((l) => ({ name: primeiroNome(l.nome), value: l.meta }));
  }, [linhasFiltradas, umVendedor]);

  // faróis (KPIs) do período/filtro
  const farois = useMemo(() => {
    const meta = linhasFiltradas.reduce((s, l) => s + l.meta, 0);
    const venda = linhasFiltradas.reduce((s, l) => s + l.vendaLiquida, 0);
    const atingimento = meta > 0 ? (venda / meta) * 100 : 0;
    const projValor = dias.passados > 0 ? (venda / dias.passados) * dias.totais : 0;
    const projMeta = meta > 0 ? (projValor / meta) * 100 : 0;
    const aindaFalta = Math.max(meta - venda, 0);
    return { meta, venda, atingimento, projValor, projMeta, aindaFalta };
  }, [linhasFiltradas, dias]);

  // ---- snapshot antes de gravar ----
  const criarSnapshot = async (descricao: string) => {
    try {
      const snap = linhas.map((l) => ({ codigo: l.codigo, meta: l.meta, venda: l.vendaLiquida }));
      const { error } = await supabase.from("metas_historico").insert({ ano, descricao, snapshot: snap });
      if (error) console.warn("snapshot falhou:", error.message);
    } catch (e) { console.warn("snapshot erro:", (e as Error).message); }
  };

  // ---- edição ----
  const iniciarEdicao = () => { editRef.current = {}; linhas.forEach((l) => { editRef.current[l.codigo] = l.meta; }); setEditando(true); };
  const salvarEdicao = async () => {
    setSalvando(true);
    try {
      await criarSnapshot("Edição de metas");
      const mes = meses[0];
      const payload = Object.entries(editRef.current).map(([codigo, meta]) => ({ codigo, ano, mes, meta }));
      const { error } = await supabase.from("metas_vendedores").upsert(payload, { onConflict: "codigo,ano,mes" });
      if (error) throw error;
      toast.success("Metas salvas.");
      setEditando(false);
      invalidar();
    } catch (e) { toast.error("Erro ao salvar: " + (e as Error).message); }
    finally { setSalvando(false); }
  };

  // ---- importação ----
  const onArquivo = async (file: File) => {
    try {
      const res = await importarPlanilha(file, todos.map((v) => ({ codigo: v.codigo, nome: v.nome })));
      if (!res.linhas.length && !res.naoReconhecidos.length) { toast.error("Nada reconhecido na planilha."); return; }
      setImportResult(res);
    } catch (e) { toast.error((e as Error).message); }
  };
  const confirmarImport = async (assign: Record<string, string>, mes: number) => {
    if (!importResult) return;
    setGravandoImport(true);
    try {
      await criarSnapshot(`Antes de importação - ${MESES_LONGO[mes - 1]}`);
      // agrega por vendedor: reconhecidos + combinados + atribuições/criações manuais
      const soma: Record<string, number> = {};
      importResult.linhas.forEach((l) => { soma[l.codigo] = (soma[l.codigo] ?? 0) + l.valor; });
      const criar: { codigo: string; nome: string; setor: string; ativo: boolean; updated_at: string }[] = [];
      const agora = new Date().toISOString();
      let seq = Date.now();
      importResult.naoReconhecidos.forEach((r) => {
        const escolha = assign[r.nome];
        if (!escolha || escolha === "ignorar") return;
        if (escolha === "__criar__") {
          const codigo = r.codigo || ("NV" + (seq++).toString().slice(-8));
          criar.push({ codigo, nome: r.nome.toUpperCase(), setor: "Outros", ativo: true, updated_at: agora });
          soma[codigo] = (soma[codigo] ?? 0) + r.valor;
        } else {
          soma[escolha] = (soma[escolha] ?? 0) + r.valor;
        }
      });
      if (criar.length) {
        const { error: eC } = await supabase.from("vendedores_config").upsert(criar, { onConflict: "codigo" });
        if (eC) throw eC;
      }
      const payload = Object.entries(soma).map(([codigo, venda_liquida]) => ({ codigo, ano, mes, venda_liquida }));
      if (!payload.length) { toast.error("Nada para gravar."); setGravandoImport(false); return; }
      const { error } = await supabase.from("metas_vendedores").upsert(payload, { onConflict: "codigo,ano,mes" });
      if (error) throw error;
      toast.success(`Importado em ${MESES_LONGO[mes - 1]}: ${payload.length} vendedor(es)${criar.length ? ` · ${criar.length} novo(s) criado(s)` : ""}.`);
      setImportResult(null);
      onMeses([mes]);
      invalidar();
    } catch (e) { toast.error("Erro ao gravar: " + (e as Error).message); }
    finally { setGravandoImport(false); }
  };

  // ---- desfazer (restaura último snapshot) ----
  const desfazer = async () => {
    try {
      const { data, error } = await supabase.from("metas_historico").select("id, snapshot").eq("ano", ano).order("created_at", { ascending: false }).limit(1);
      if (error) throw error;
      const snap = data?.[0]?.snapshot as { codigo: string; meta?: number; venda?: number }[] | undefined;
      if (!snap) { toast.info("Sem snapshot para restaurar."); return; }
      const mes = meses[0];
      const payload = snap.map((s) => ({ codigo: s.codigo, ano, mes, meta: s.meta ?? 0, venda_liquida: s.venda ?? 0 }));
      const { error: e2 } = await supabase.from("metas_vendedores").upsert(payload, { onConflict: "codigo,ano,mes" });
      if (e2) throw e2;
      toast.success("Importação desfeita.");
      invalidar();
    } catch (e) { toast.error("Erro ao desfazer: " + (e as Error).message); }
  };

  // ---- histórico ----
  const abrirHistorico = async () => {
    try {
      const { data, error } = await supabase.from("metas_historico").select("id, created_at, descricao").eq("ano", ano).order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      setSnapshots(data ?? []);
      setHistAberto(true);
    } catch (e) { toast.error("Erro ao carregar histórico: " + (e as Error).message); }
  };
  const apagarSnapshot = async (id: string) => {
    try {
      const { error } = await supabase.from("metas_historico").delete().eq("id", id);
      if (error) throw error;
      setSnapshots((cur) => cur.filter((s) => s.id !== id));
      toast.success("Snapshot apagado.");
    } catch (e) { toast.error("Erro ao apagar: " + (e as Error).message); }
  };
  const apagarTodosSnapshots = async () => {
    try {
      const { error } = await supabase.from("metas_historico").delete().eq("ano", ano);
      if (error) throw error;
      setSnapshots([]);
      toast.success("Histórico apagado.");
    } catch (e) { toast.error("Erro ao apagar: " + (e as Error).message); }
  };
  const restaurarSnapshot = async (id: string) => {
    try {
      const { data, error } = await supabase.from("metas_historico").select("snapshot").eq("id", id).single();
      if (error) throw error;
      const snap = data?.snapshot as { codigo: string; meta?: number; venda?: number }[];
      const mes = meses[0];
      const { error: e2 } = await supabase.from("metas_vendedores").upsert(snap.map((s) => ({ codigo: s.codigo, ano, mes, meta: s.meta ?? 0, venda_liquida: s.venda ?? 0 })), { onConflict: "codigo,ano,mes" });
      if (e2) throw e2;
      toast.success("Snapshot restaurado.");
      setHistAberto(false);
      invalidar();
    } catch (e) { toast.error("Erro ao restaurar: " + (e as Error).message); }
  };

  // ---- exportar ----
  const exportar = () => {
    const rows = linhasFiltradas.map((l) => ({
      Vendedor: l.nome, Setor: l.setor, Meta: l.meta, "Venda Líquida": l.vendaLiquida,
      "Atingimento %": +l.atingimento.toFixed(1), "Falta p/ meta": +l.faltaMeta.toFixed(2),
      Projeção: +l.projecao.toFixed(2), "Projeção %": +l.projecaoPct.toFixed(1),
    }));
    rows.push({ Vendedor: "TOTAL", Setor: "", Meta: totalGeral.meta, "Venda Líquida": totalGeral.vl, "Atingimento %": 0, "Falta p/ meta": 0, Projeção: 0, "Projeção %": 0 } as never);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Metas");
    XLSX.writeFile(wb, "metas_vendedores.xlsx");
  };

  // ---- somar meses ----
  const toggleMes = (m: number) => onMeses(meses.includes(m) ? meses.filter((x) => x !== m) : [...meses, m].sort((a, b) => a - b));

  return (
    <div>
      {/* Topo: filtro de vendedor + ações */}
      <div className="flex flex-wrap gap-2 mb-5 items-center">
        <Select value={filtroVendedor} onValueChange={setFiltroVendedor}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Vendedor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Vendedores</SelectItem>
            {[...linhas].sort((a, b) => (a.nome || "").localeCompare(b.nome || "")).map((l) => (
              <SelectItem key={l.codigo} value={l.codigo}>{l.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!editando ? (
          <Button variant="outline" disabled={multiMes} onClick={iniciarEdicao}><Pencil className="w-4 h-4" /> Editar Valores</Button>
        ) : (
          <>
            <Button onClick={salvarEdicao} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
            <Button variant="outline" onClick={() => setEditando(false)} disabled={salvando}>Cancelar</Button>
          </>
        )}
        <Button variant="outline" disabled={multiMes || editando} onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4" /> Importar Planilha</Button>
        <Button variant="outline" onClick={desfazer}><Undo2 className="w-4 h-4" /> Desfazer</Button>
        <Button variant="outline" onClick={abrirHistorico}><History className="w-4 h-4" /> Histórico</Button>
        <Popover trigger={<Button variant="outline"><Sigma className="w-4 h-4" /> Somar Meses</Button>} className="w-48">
          <div className="grid grid-cols-3 gap-1">
            {MESES.map((m, i) => (
              <label key={m} className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={meses.includes(i + 1)} onChange={() => toggleMes(i + 1)} />{m}
              </label>
            ))}
          </div>
        </Popover>
        <Button variant="outline" onClick={() => setGerenciarAberto(true)}><Users className="w-4 h-4" /> Gerenciar Equipe</Button>
        <Button variant="outline" onClick={exportar}><Download className="w-4 h-4" /> Exportar Excel</Button>
        <Button variant="outline" onClick={() => setOculto((o) => !o)} title={oculto ? "Mostrar valores" : "Ocultar valores"} className="px-3">{oculto ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</Button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.ods" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onArquivo(f); e.target.value = ""; }} />
        {multiMes && <span className="text-xs text-muted-foreground">Somando {meses.length} meses</span>}
      </div>

      {/* Faróis (KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
        <Farol icone={<Target className="w-4 h-4" />} titulo={`Meta ${MESES[(meses[0] ?? 1) - 1]}`} valor={money(farois.meta)} cor="verde" loading={loading} />
        <Farol icone={<DollarSign className="w-4 h-4" />} titulo="Venda Líquida" valor={money(farois.venda)} loading={loading} />
        <Farol icone={<Target className="w-4 h-4" />} titulo="Ainda Falta (R$)" valor={money(farois.aindaFalta)} cor={farois.aindaFalta > 0 ? "vermelho" : "verde"} loading={loading} />
        <Farol icone={<Percent className="w-4 h-4" />} titulo="Atingimento" valor={pct(farois.atingimento)} cor={semaforo(farois.atingimento)} loading={loading} />
        <Farol icone={<TrendingUp className="w-4 h-4" />} titulo="Projeção Valor" valor={money(farois.projValor)} loading={loading} />
        <Farol icone={<Target className="w-4 h-4" />} titulo="Projeção Meta %" valor={pct(farois.projMeta)} cor={semaforo(farois.projMeta)} loading={loading} />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5 max-w-xl">
        <Farol icone={<Calendar className="w-4 h-4" />} titulo="Total Dias Úteis" valor={String(dias.totais)} loading={loading} />
        <Farol icone={<Clock className="w-4 h-4" />} titulo="Dias Passados" valor={String(dias.passados)} loading={loading} />
        <Farol icone={<TrendingUp className="w-4 h-4" />} titulo="Dias Restantes" valor={String(dias.restantes)} amarelo loading={loading} />
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <div className="rounded-2xl border border-border bg-white p-5">
          <h3 className="text-pasto-escuro font-semibold mb-3">Meta vs Venda por Vendedor</h3>
          <BarrasVendedorLazy data={barData} />
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <h3 className="text-pasto-escuro font-semibold mb-3">{pieTitulo}</h3>
          <PizzaLazy data={pieData} />
        </div>
      </div>

      {multiMes && <div className="mb-3 text-xs bg-pasto-claro text-pasto-escuro rounded-lg px-3 py-2 inline-block">Modo análise ({meses.length} meses somados) — edição e importação desabilitadas.</div>}

      {/* Tabela por setor */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-pasto-claro text-[#3d5334]">
              <th className="text-left px-3 py-2">Vendedor</th>
              <th className="text-right px-2 py-2">Meta</th>
              <th className="text-right px-2 py-2">Venda Líq.</th>
              <th className="text-right px-2 py-2">Ating.</th>
              <th className="text-right px-2 py-2">Falta</th>
              <th className="text-right px-2 py-2">Méd/dia</th>
              <th className="text-right px-2 py-2">Ritmo nec.</th>
              <th className="text-right px-2 py-2">Projeção</th>
              <th className="text-right px-2 py-2">Proj. %</th>
            </tr>
          </thead>
          <tbody>
            {porSetor.map(({ setor, itens }) => {
              const sub = { meta: itens.reduce((s, l) => s + l.meta, 0), vl: itens.reduce((s, l) => s + l.vendaLiquida, 0) };
              return (
                <React.Fragment key={setor}>
                  <tr className="bg-[#f3f8f1]"><td colSpan={9} className="px-3 py-1.5 font-semibold text-pasto-escuro">{setor}</td></tr>
                  {itens.map((l) => {
                    const sem = semaforo(l.atingimento);
                    return (
                      <tr key={l.codigo} className="hover:bg-[#fafcf8]">
                        <td className="px-3 py-2 border-b border-[#eef1eb] whitespace-nowrap">{l.nome}</td>
                        <td className="px-2 py-2 text-right border-b border-[#eef1eb] font-semibold">
                          {editando ? (
                            <input type="number" defaultValue={l.meta} onChange={(e) => { editRef.current[l.codigo] = Number(e.target.value) || 0; }}
                              className="w-24 text-right border border-pasto-amarelo rounded px-1 py-0.5" />
                          ) : money(l.meta)}
                        </td>
                        <td className="px-2 py-2 text-right border-b border-[#eef1eb] font-semibold">{money(l.vendaLiquida)}</td>
                        <td className="px-2 py-2 text-right border-b border-[#eef1eb]">
                          <span className={`inline-block px-1.5 py-0.5 rounded-full font-semibold ${semCor[sem]}`}>{pct(l.atingimento)}</span>
                        </td>
                        <td className="px-2 py-2 text-right border-b border-[#eef1eb]">{money(l.faltaMeta)}</td>
                        <td className="px-2 py-2 text-right border-b border-[#eef1eb]">{money(l.mediaDiaUtil)}</td>
                        <td className="px-2 py-2 text-right border-b border-[#eef1eb]">{money(l.ritmoNecessario)}</td>
                        <td className="px-2 py-2 text-right border-b border-[#eef1eb]">{money(l.projecao)}</td>
                        <td className="px-2 py-2 text-right border-b border-[#eef1eb]">{pct(l.projecaoPct)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-[#fbfdf9] font-semibold">
                    <td className="px-3 py-1.5 border-b border-[#eef1eb]">Subtotal {setor}</td>
                    <td className="px-2 py-1.5 text-right border-b border-[#eef1eb]">{money(sub.meta)}</td>
                    <td className="px-2 py-1.5 text-right border-b border-[#eef1eb]">{money(sub.vl)}</td>
                    <td colSpan={6} className="border-b border-[#eef1eb]"></td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-pasto-claro font-bold">
              <td className="px-3 py-2">TOTAL GERAL</td>
              <td className="px-2 py-2 text-right">{money(totalGeral.meta)}</td>
              <td className="px-2 py-2 text-right">{money(totalGeral.vl)}</td>
              <td className="px-2 py-2 text-right">{pct(totalGeral.meta > 0 ? (totalGeral.vl / totalGeral.meta) * 100 : 0)}</td>
              <td colSpan={5}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <ImportarDialog resultado={importResult} vendedores={linhas.map((l) => ({ codigo: l.codigo, nome: l.nome }))} ano={ano} mesInicial={meses[0] ?? new Date().getMonth() + 1} onConfirmar={confirmarImport} onCancelar={() => setImportResult(null)} gravando={gravandoImport} />

      <GerenciarEquipeModal open={gerenciarAberto} onOpenChange={setGerenciarAberto} vendedores={todos} onSaved={invalidar} />

      {/* Histórico */}
      <Dialog open={histAberto} onOpenChange={setHistAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-pasto-escuro">Histórico de snapshots</DialogTitle>
            <DialogDescription>Últimos 30 snapshots. Restaure para o mês selecionado.</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-auto divide-y">
            {snapshots.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0 flex-1">{new Date(s.created_at).toLocaleString("pt-BR")}<div className="text-xs text-muted-foreground truncate">{s.descricao}</div></span>
                <Button size="sm" variant="outline" onClick={() => restaurarSnapshot(s.id)}>Restaurar</Button>
                <Button size="sm" variant="outline" className="text-[#b12318] px-2" title="Apagar" onClick={() => apagarSnapshot(s.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            {!snapshots.length && <div className="py-4 text-muted-foreground text-sm">Nenhum snapshot ainda.</div>}
          </div>
          <DialogFooter className="justify-between">
            {snapshots.length > 0 && <Button variant="outline" className="text-[#b12318]" onClick={apagarTodosSnapshots}>Apagar todos</Button>}
            <Button variant="outline" onClick={() => setHistAberto(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

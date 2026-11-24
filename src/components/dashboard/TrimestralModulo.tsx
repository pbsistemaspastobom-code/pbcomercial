// src/components/dashboard/TrimestralModulo.tsx
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Pencil, Upload, Download, EyeOff, Eye, ChevronRight } from "lucide-react";
import { ImportarDialog } from "@/components/dashboard/ImportarDialog";
import { CurrencyInput } from "@/components/ui/currency-input";
import { importarPlanilha, type ResultadoImport } from "@/lib/importVendas";
import { useTrimestralData } from "@/hooks/useTrimestralData";
import type { VendedorEfetivo } from "@/hooks/useMetasData";
import { brl2, pct, semaforo } from "@/lib/formato";

const semCor = { verde: "text-[#1f7a1a]", amarelo: "text-[#9A7A00]", vermelho: "text-[#9A7A00]" };

export function TrimestralModulo({ ano, todos }: { ano: number; todos: VendedorEfetivo[] }) {
  const { porTri, linhas, metaGeral, invalidar } = useTrimestralData(ano);
  const [tri, setTri] = useState(1);
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [metaInput, setMetaInput] = useState(0);
  const [salvandoMeta, setSalvandoMeta] = useState(false);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [oculto, setOculto] = useState(false);
  const [importResult, setImportResult] = useState<ResultadoImport | null>(null);
  const [gravando, setGravando] = useState(false);
  const editRef = useRef<Record<string, { meta: number; venda: number }>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const dados = linhas(tri);
  const money = (v: number) => (oculto ? "•••••" : brl2(v));
  const resumo = porTri.find((p) => p.tri === tri)!;
  const totalVenda = dados.reduce((s, l) => s + l.venda, 0);
  const participacao = (v: number) => (totalVenda > 0 ? (v / totalVenda) * 100 : 0);

  // Agrupa por setor (maior Venda Líquida primeiro)
  const grupos = Object.values(
    dados.reduce<Record<string, { setor: string; venda: number; vendedores: typeof dados }>>((acc, l) => {
      const s = l.setor || "Sem setor";
      (acc[s] ??= { setor: s, venda: 0, vendedores: [] }).vendedores.push(l);
      acc[s].venda += l.venda;
      return acc;
    }, {})
  )
    .map((g) => ({ ...g, vendedores: [...g.vendedores].sort((a, b) => b.venda - a.venda) }))
    .sort((a, b) => b.venda - a.venda);
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const alternar = (s: string) => setAbertos((prev) => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });
  const todosAbertos = grupos.length > 0 && grupos.every((g) => abertos.has(g.setor));
  const alternarTodos = () => setAbertos(todosAbertos ? new Set() : new Set(grupos.map((g) => g.setor)));

  const iniciarEdicao = () => { editRef.current = {}; dados.forEach((l) => { editRef.current[l.codigo] = { meta: l.meta, venda: l.venda }; }); setEditando(true); };
  const salvarEdicao = async () => {
    setSalvando(true);
    try {
      const payload = Object.entries(editRef.current).map(([codigo, v]) => ({ codigo, ano, trimestre: tri, meta: v.meta, venda_liquida: v.venda, updated_at: new Date().toISOString() }));
      const { error } = await supabase.from("trimestral_dados").upsert(payload, { onConflict: "codigo,ano,trimestre" });
      if (error) throw error;
      toast.success(`Q${tri} salvo.`);
      setEditando(false);
      window.dispatchEvent(new CustomEvent("trimestral-changed"));
      invalidar();
    } catch (e) { toast.error("Erro ao salvar: " + (e as Error).message); }
    finally { setSalvando(false); }
  };

  const onArquivo = async (file: File) => {
    try {
      const res = await importarPlanilha(file, todos.map((v) => ({ codigo: v.codigo, nome: v.nome })));
      if (!res.linhas.length && !res.naoReconhecidos.length) { toast.error("Nada reconhecido na planilha."); return; }
      setImportResult(res);
    } catch (e) { toast.error((e as Error).message); }
  };
  const confirmarImport = async (assign: Record<string, string>) => {
    if (!importResult) return;
    setGravando(true);
    try {
      const soma: Record<string, number> = {};
      importResult.linhas.forEach((l) => { soma[l.codigo] = (soma[l.codigo] ?? 0) + l.valor; });
      const criar: { codigo: string; nome: string; setor: string; ativo: boolean; updated_at: string }[] = [];
      let seq = Date.now();
      importResult.naoReconhecidos.forEach((r) => {
        const e = assign[r.nome];
        if (!e || e === "ignorar") return;
        if (e === "__criar__") { const codigo = r.codigo || ("NV" + (seq++).toString().slice(-8)); criar.push({ codigo, nome: r.nome.toUpperCase(), setor: "Outros", ativo: true, updated_at: new Date().toISOString() }); soma[codigo] = (soma[codigo] ?? 0) + r.valor; }
        else soma[e] = (soma[e] ?? 0) + r.valor;
      });
      if (criar.length) { const { error } = await supabase.from("vendedores_config").upsert(criar, { onConflict: "codigo" }); if (error) throw error; }
      // grava a VENDA acumulada do trimestre (meta preservada)
      const existentes: Record<string, number> = {};
      dados.forEach((d) => { existentes[d.codigo] = d.meta; });
      const payload = Object.entries(soma).map(([codigo, venda]) => ({ codigo, ano, trimestre: tri, meta: existentes[codigo] ?? 0, venda_liquida: venda, updated_at: new Date().toISOString() }));
      if (!payload.length) { toast.error("Nada para gravar."); setGravando(false); return; }
      const { error } = await supabase.from("trimestral_dados").upsert(payload, { onConflict: "codigo,ano,trimestre" });
      if (error) throw error;
      toast.success(`Q${tri}: ${payload.length} vendedor(es)${criar.length ? ` · ${criar.length} novo(s)` : ""}.`);
      setImportResult(null);
      window.dispatchEvent(new CustomEvent("trimestral-changed"));
      invalidar();
    } catch (e) { toast.error("Erro ao gravar: " + (e as Error).message); }
    finally { setGravando(false); }
  };

  const abrirEdicaoMeta = () => { setMetaInput(metaGeral(tri)); setEditandoMeta(true); };
  const salvarMetaGeral = async () => {
    setSalvandoMeta(true);
    try {
      const { error } = await supabase.from("trimestral_dados").upsert(
        [{ codigo: "__GERAL__", ano, trimestre: tri, meta: metaInput, venda_liquida: 0, updated_at: new Date().toISOString() }],
        { onConflict: "codigo,ano,trimestre" }
      );
      if (error) throw error;
      toast.success(`Meta geral do Q${tri} salva.`);
      setEditandoMeta(false);
      window.dispatchEvent(new CustomEvent("trimestral-changed"));
      invalidar();
    } catch (e) { toast.error("Erro ao salvar meta: " + (e as Error).message); }
    finally { setSalvandoMeta(false); }
  };

  const exportar = () => {
    const rows = [["Vendedor", "Setor", "Venda Liquida", "% do Total"]];
    dados.forEach((l) => rows.push([l.nome, l.setor, String(l.venda), participacao(l.venda).toFixed(1)]));
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `trimestral_Q${tri}_${ano}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Abas dos trimestres */}
      <div className="flex gap-2 mb-5">
        {[1, 2, 3, 4].map((q) => (
          <button key={q} onClick={() => { setTri(q); setEditando(false); }} className={`px-5 py-2 rounded-lg text-sm font-semibold ${tri === q ? "bg-primary text-white" : "bg-white border border-border text-ink-soft"}`}>
            Q{q}
          </button>
        ))}
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {!editando ? (
          <Button variant="outline" onClick={iniciarEdicao}><Pencil className="w-4 h-4" /> Editar Valores</Button>
        ) : (
          <>
            <Button onClick={salvarEdicao} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
            <Button variant="outline" onClick={() => setEditando(false)} disabled={salvando}>Cancelar</Button>
          </>
        )}
        <Button variant="outline" disabled={editando} onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4" /> Importar Acumulado</Button>
        <Button variant="outline" onClick={exportar}><Download className="w-4 h-4" /> Exportar</Button>
        <Button variant="outline" className="px-3" title={oculto ? "Mostrar" : "Ocultar"} onClick={() => setOculto((o) => !o)}>{oculto ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</Button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.ods" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onArquivo(f); e.target.value = ""; }} />
      </div>

      {/* KPIs do trimestre */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="card-soft p-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase text-ink-mute font-semibold">Meta Geral Q{tri}</div>
            {!editandoMeta && <button onClick={abrirEdicaoMeta} className="text-primary" title="Editar meta geral"><Pencil className="w-3.5 h-3.5" /></button>}
          </div>
          {editandoMeta ? (
            <div className="flex items-center gap-1 mt-1">
              <CurrencyInput defaultValue={metaInput} onChange={setMetaInput} className="w-28 text-right border border-pasto-amarelo rounded px-1 py-0.5 text-sm" />
              <button onClick={salvarMetaGeral} disabled={salvandoMeta} className="text-[11px] bg-primary text-white rounded px-2 py-1">{salvandoMeta ? "..." : "OK"}</button>
              <button onClick={() => setEditandoMeta(false)} className="text-[11px] text-ink-mute px-1">✕</button>
            </div>
          ) : (
            <div className="font-headline text-xl font-bold text-primary mt-1 tnum">{money(resumo.meta)}</div>
          )}
        </div>
        <div className="card-soft p-4"><div className="text-[11px] uppercase text-ink-mute font-semibold">Venda Líquida</div><div className="font-headline text-xl font-bold text-primary mt-1 tnum">{money(resumo.venda)}</div></div>
        <div className="card-soft p-4"><div className="text-[11px] uppercase text-ink-mute font-semibold">Atingimento</div><div className={`font-headline text-xl font-bold mt-1 tnum ${semCor[semaforo(resumo.atingimento)]}`}>{pct(resumo.atingimento)}</div></div>
        <div className="card-soft p-4"><div className="text-[11px] uppercase text-ink-mute font-semibold">Ainda Falta</div><div className="font-headline text-xl font-bold text-[#9A7A00] mt-1 tnum">{money(Math.max(resumo.meta - resumo.venda, 0))}</div></div>
      </div>

      {/* Tabela agrupada por setor */}
      <div className="card-soft p-5 overflow-x-auto">
        {!!grupos.length && (
          <div className="flex justify-end mb-2">
            <button onClick={alternarTodos} disabled={editando} className="text-xs font-semibold text-primary hover:underline disabled:opacity-40">
              {todosAbertos ? "Recolher todos" : "Expandir todos"}
            </button>
          </div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-ink-mute text-left border-b border-[#e9ecef]">
              <th className="py-2.5">Setor / Vendedor</th>
              <th className="py-2.5 text-right">Venda Líquida</th>
              <th className="py-2.5 text-right w-[34%]">% do Total</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((g) => {
              const aberto = editando || abertos.has(g.setor);
              const pg = participacao(g.venda);
              return (
                <React.Fragment key={g.setor}>
                  <tr className="border-b border-[#e9ecef] bg-[#f6f8f5] cursor-pointer select-none hover:bg-[#eef2ec]" onClick={() => !editando && alternar(g.setor)}>
                    <td className="py-3 pl-1 font-semibold text-ink">
                      <span className="inline-flex items-center gap-2">
                        <ChevronRight className={`w-4 h-4 text-primary transition-transform ${aberto ? "rotate-90" : ""}`} />
                        {g.setor}
                        <span className="text-[11px] font-normal text-ink-mute">({g.vendedores.length} vendedor{g.vendedores.length === 1 ? "" : "es"})</span>
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold tnum">{money(g.venda)}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="hidden sm:block flex-1 max-w-[180px] h-2 rounded-full bg-[#e3e8e1] overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(pg, 100)}%` }} />
                        </div>
                        <span className="font-bold text-primary tnum w-14 text-right">{pct(pg)}</span>
                      </div>
                    </td>
                  </tr>
                  {aberto && g.vendedores.map((l) => (
                    <tr key={l.codigo} className="border-b border-[#f1f3f4]">
                      <td className="py-2.5 pl-9">{l.nome}</td>
                      <td className="py-2.5 text-right font-semibold tnum">
                        {editando ? <CurrencyInput defaultValue={l.venda} onChange={(v) => { editRef.current[l.codigo] = { ...editRef.current[l.codigo], venda: v }; }} className="w-28 text-right border border-pasto-amarelo rounded px-1 py-0.5" /> : money(l.venda)}
                      </td>
                      <td className="py-2.5 text-right tnum">
                        <span className="font-bold text-primary">{pct(participacao(l.venda))}</span>
                        <span className="block text-[11px] text-ink-mute">{pct(g.venda > 0 ? (l.venda / g.venda) * 100 : 0)} do setor</span>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
            {!dados.length && <tr><td colSpan={3} className="py-6 text-center text-ink-mute">Nenhum dado no Q{tri}. Importe o acumulado ou use Editar Valores.</td></tr>}
          </tbody>
          {!!grupos.length && (
            <tfoot>
              <tr className="border-t-2 border-[#e9ecef]">
                <td className="py-3 pl-1 font-bold">Total</td>
                <td className="py-3 text-right font-bold tnum">{money(totalVenda)}</td>
                <td className="py-3 text-right font-bold text-primary tnum">{pct(totalVenda > 0 ? 100 : 0)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <ImportarDialog resultado={importResult} vendedores={todos.map((v) => ({ codigo: v.codigo, nome: v.nome }))} ano={ano} mesInicial={1} contextoLabel={`Trimestre ${tri} (Q${tri})`} onConfirmar={confirmarImport} onCancelar={() => setImportResult(null)} gravando={gravando} />
    </div>
  );
}

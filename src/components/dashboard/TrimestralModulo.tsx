// src/components/dashboard/TrimestralModulo.tsx
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Pencil, Upload, Download, EyeOff, Eye } from "lucide-react";
import { ImportarDialog } from "@/components/dashboard/ImportarDialog";
import { importarPlanilha, type ResultadoImport } from "@/lib/importVendas";
import { useTrimestralData } from "@/hooks/useTrimestralData";
import type { VendedorEfetivo } from "@/hooks/useMetasData";
import { brl2, pct, semaforo } from "@/lib/formato";

const semCor = { verde: "text-[#1f7a1a]", amarelo: "text-[#8a6d00]", vermelho: "text-[#d0342c]" };

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
    const rows = [["Vendedor", "Setor", "Meta", "Venda Liquida", "Atingimento %"]];
    dados.forEach((l) => rows.push([l.nome, l.setor, String(l.meta), String(l.venda), l.atingimento.toFixed(1)]));
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
              <input type="number" value={metaInput} onChange={(e) => setMetaInput(Number(e.target.value) || 0)} className="w-28 text-right border border-pasto-amarelo rounded px-1 py-0.5 text-sm" />
              <button onClick={salvarMetaGeral} disabled={salvandoMeta} className="text-[11px] bg-primary text-white rounded px-2 py-1">{salvandoMeta ? "..." : "OK"}</button>
              <button onClick={() => setEditandoMeta(false)} className="text-[11px] text-ink-mute px-1">✕</button>
            </div>
          ) : (
            <div className="font-headline text-xl font-bold text-primary mt-1 tnum">{money(resumo.meta)}</div>
          )}
        </div>
        <div className="card-soft p-4"><div className="text-[11px] uppercase text-ink-mute font-semibold">Venda Líquida</div><div className="font-headline text-xl font-bold text-primary mt-1 tnum">{money(resumo.venda)}</div></div>
        <div className="card-soft p-4"><div className="text-[11px] uppercase text-ink-mute font-semibold">Atingimento</div><div className={`font-headline text-xl font-bold mt-1 tnum ${semCor[semaforo(resumo.atingimento)]}`}>{pct(resumo.atingimento)}</div></div>
        <div className="card-soft p-4"><div className="text-[11px] uppercase text-ink-mute font-semibold">Ainda Falta</div><div className="font-headline text-xl font-bold text-[#d0342c] mt-1 tnum">{money(Math.max(resumo.meta - resumo.venda, 0))}</div></div>
      </div>

      {/* Tabela */}
      <div className="card-soft p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-ink-mute text-left border-b border-[#e9ecef]">
              <th className="py-2.5">Vendedor</th><th className="py-2.5">Setor</th>
              <th className="py-2.5 text-right">Meta</th><th className="py-2.5 text-right">Venda Líquida</th><th className="py-2.5 text-right">Atingimento</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((l) => (
              <tr key={l.codigo} className="border-b border-[#f1f3f4]">
                <td className="py-2.5">{l.nome}</td>
                <td className="py-2.5 text-ink-mute">{l.setor}</td>
                <td className="py-2.5 text-right">
                  {editando ? <input type="number" defaultValue={l.meta} onChange={(e) => { editRef.current[l.codigo] = { ...editRef.current[l.codigo], meta: Number(e.target.value) || 0 }; }} className="w-24 text-right border border-pasto-amarelo rounded px-1 py-0.5" /> : money(l.meta)}
                </td>
                <td className="py-2.5 text-right font-semibold">
                  {editando ? <input type="number" defaultValue={l.venda} onChange={(e) => { editRef.current[l.codigo] = { ...editRef.current[l.codigo], venda: Number(e.target.value) || 0 }; }} className="w-24 text-right border border-pasto-amarelo rounded px-1 py-0.5" /> : money(l.venda)}
                </td>
                <td className="py-2.5 text-right font-bold" style={{ color: l.atingimento >= 100 ? "#1f7a1a" : l.atingimento >= 80 ? "#8a6d00" : "#d0342c" }}>{pct(l.atingimento)}</td>
              </tr>
            ))}
            {!dados.length && <tr><td colSpan={5} className="py-6 text-center text-ink-mute">Nenhum dado no Q{tri}. Importe o acumulado ou use Editar Valores.</td></tr>}
          </tbody>
        </table>
      </div>

      <ImportarDialog resultado={importResult} vendedores={todos.map((v) => ({ codigo: v.codigo, nome: v.nome }))} ano={ano} mesInicial={1} contextoLabel={`Trimestre ${tri} (Q${tri})`} onConfirmar={confirmarImport} onCancelar={() => setImportResult(null)} gravando={gravando} />
    </div>
  );
}

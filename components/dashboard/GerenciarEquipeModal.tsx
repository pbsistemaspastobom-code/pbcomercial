// src/components/dashboard/GerenciarEquipeModal.tsx
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { SETORES, VENDEDORES, type Setor } from "@/data/planejamento2026";
import type { VendedorEfetivo } from "@/hooks/useMetasData";
import { brl2 } from "@/lib/formato";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vendedores: VendedorEfetivo[];
  onSaved: () => void;
}
interface Confirmar { v: VendedorEfetivo; lancamentos: number; total: number; estatico: boolean; }
const COD_ESTATICOS = new Set(VENDEDORES.map((x) => x.codigo));

export const GerenciarEquipeModal = React.memo(function GerenciarEquipeModal({ open, onOpenChange, vendedores, onSaved }: Props) {
  const [lista, setLista] = useState<VendedorEfetivo[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [novo, setNovo] = useState<{ codigo: string; nome: string; setor: Setor }>({ codigo: "", nome: "", setor: "Outros" });
  const [confirmar, setConfirmar] = useState<Confirmar | null>(null);
  const [apagarDados, setApagarDados] = useState(false);
  const [checando, setChecando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => { if (open) { setLista(vendedores.map((v) => ({ ...v }))); setConfirmar(null); } }, [open, vendedores]);

  const set = (codigo: string, patch: Partial<VendedorEfetivo>) =>
    setLista((cur) => cur.map((v) => (v.codigo === codigo ? { ...v, ...patch } : v)));

  const adicionar = () => {
    const codigo = novo.codigo.trim();
    if (!codigo || !novo.nome.trim()) { toast.error("Informe código e nome."); return; }
    if (lista.some((v) => v.codigo === codigo)) { toast.error("Código já existe."); return; }
    setLista((cur) => [...cur, { codigo, nome: novo.nome.trim().toUpperCase(), setor: novo.setor, ativo: true }]);
    setNovo({ codigo: "", nome: "", setor: "Outros" });
  };

  // pede exclusão: verifica se há vendas lançadas
  const pedirExcluir = async (v: VendedorEfetivo) => {
    setChecando(true); setApagarDados(false);
    try {
      const { data, error } = await supabase.from("metas_vendedores").select("venda_liquida").eq("codigo", v.codigo);
      if (error) throw error;
      const lancamentos = (data ?? []).length;
      const total = (data ?? []).reduce((s, r) => s + (Number((r as { venda_liquida: number }).venda_liquida) || 0), 0);
      setConfirmar({ v, lancamentos, total, estatico: COD_ESTATICOS.has(v.codigo) });
    } catch (e) { toast.error("Erro ao checar dados: " + (e as Error).message); }
    finally { setChecando(false); }
  };

  const confirmarExclusao = async () => {
    if (!confirmar) return;
    setExcluindo(true);
    try {
      const cod = confirmar.v.codigo;
      if (apagarDados) {
        const { error: e1 } = await supabase.from("metas_vendedores").delete().eq("codigo", cod);
        if (e1) throw e1;
      }
      const { error: e2 } = await supabase.from("vendedores_config").delete().eq("codigo", cod);
      if (e2) throw e2;
      setLista((cur) => cur.filter((x) => x.codigo !== cod));
      toast.success(confirmar.estatico ? "Removido do banco. (Cadastro base pode reaparecer — veja o aviso.)" : "Vendedor excluído.");
      setConfirmar(null);
      onSaved();
    } catch (e) { toast.error("Erro ao excluir: " + (e as Error).message); }
    finally { setExcluindo(false); }
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      const payload = lista.map((v) => ({ codigo: v.codigo, nome: v.nome, setor: v.setor, ativo: v.ativo, updated_at: new Date().toISOString() }));
      const { error } = await supabase.from("vendedores_config").upsert(payload, { onConflict: "codigo" });
      if (error) throw error;
      toast.success("Equipe atualizada.");
      onSaved();
      onOpenChange(false);
    } catch (e) { toast.error("Erro ao salvar: " + (e as Error).message); }
    finally { setSalvando(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[86vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-pasto-escuro">Gerenciar Equipe</DialogTitle>
          <DialogDescription>Ative/inative, mude o setor, adicione ou exclua vendedores. Inativar tira dos cálculos e preserva o histórico.</DialogDescription>
        </DialogHeader>

        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase text-[#5c6b4f] text-left">
                <th className="py-2">Vendedor</th><th className="py-2">Setor</th><th className="py-2 text-center">Ativo</th><th className="py-2 text-center">Excluir</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((v) => (
                <tr key={v.codigo} className="border-t border-[#eef1eb]">
                  <td className="py-2 pr-2">{v.nome}<div className="text-xs text-muted-foreground">Cód. {v.codigo}</div></td>
                  <td className="py-2 pr-2">
                    <select value={v.setor} onChange={(e) => set(v.codigo, { setor: e.target.value as Setor })} className="border border-border rounded-lg px-2 py-1.5 text-sm">
                      {SETORES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="py-2 text-center"><input type="checkbox" checked={v.ativo} onChange={(e) => set(v.codigo, { ativo: e.target.checked })} /></td>
                  <td className="py-2 text-center">
                    <button onClick={() => pedirExcluir(v)} disabled={checando} title="Excluir" className="text-[#b12318] hover:opacity-70 disabled:opacity-40">
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t pt-3 mt-2">
          <div className="text-xs font-semibold text-[#5c6b4f] mb-2">Adicionar vendedor</div>
          <div className="flex flex-wrap gap-2 items-center">
            <Input placeholder="Código" value={novo.codigo} onChange={(e) => setNovo({ ...novo, codigo: e.target.value })} className="w-28" />
            <Input placeholder="Nome" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} className="flex-1 min-w-[160px]" />
            <select value={novo.setor} onChange={(e) => setNovo({ ...novo, setor: e.target.value as Setor })} className="border border-border rounded-lg px-2 py-2 text-sm">
              {SETORES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button variant="outline" onClick={adicionar}><Plus className="w-4 h-4" /> Adicionar</Button>
          </div>
        </div>

        <DialogFooter className="mt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>Fechar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar alterações"}</Button>
        </DialogFooter>

        {/* Confirmação de exclusão */}
        {confirmar && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/40 rounded-2xl">
            <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-xl">
              <div className="flex items-center gap-2 text-[#b12318] font-bold mb-2"><AlertTriangle className="w-5 h-5" /> Excluir vendedor</div>
              <p className="text-sm mb-2">Excluir <strong>{confirmar.v.nome}</strong> (cód. {confirmar.v.codigo})?</p>

              {confirmar.lancamentos > 0 && (
                <div className="rounded-lg bg-[#fff5f4] border border-[#f5cfca] p-3 text-sm mb-3">
                  ⚠️ Este vendedor tem <strong>{confirmar.lancamentos} lançamento(s)</strong> de venda ({brl2(confirmar.total)} no total).
                  <label className="flex items-center gap-2 mt-2">
                    <input type="checkbox" checked={apagarDados} onChange={(e) => setApagarDados(e.target.checked)} />
                    Também apagar os dados de venda dele
                  </label>
                  {!apagarDados && <div className="text-xs text-muted-foreground mt-1">Sem marcar, os lançamentos continuam no banco (histórico), só o cadastro é removido.</div>}
                </div>
              )}

              {confirmar.estatico && (
                <div className="rounded-lg bg-[#fbf6e3] border border-[#f0e2a8] p-3 text-xs text-[#7a5c00] mb-3">
                  Este vendedor faz parte do <strong>cadastro base</strong> do sistema. A exclusão remove do banco, mas ele pode <strong>reaparecer</strong> no próximo carregamento. Para tirá-lo dos cálculos de forma definitiva, use <strong>Inativar</strong>.
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirmar(null)} disabled={excluindo}>Cancelar</Button>
                <Button className="bg-[#b12318] hover:bg-[#9a1e15]" onClick={confirmarExclusao} disabled={excluindo}>{excluindo ? "Excluindo..." : "Excluir"}</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

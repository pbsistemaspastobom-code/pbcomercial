// src/components/dashboard/GerenciarEquipeModal.tsx
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { SETORES, type Setor } from "@/data/planejamento2026";
import type { VendedorEfetivo } from "@/hooks/useMetasData";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vendedores: VendedorEfetivo[];
  onSaved: () => void;
}

export const GerenciarEquipeModal = React.memo(function GerenciarEquipeModal({ open, onOpenChange, vendedores, onSaved }: Props) {
  const [lista, setLista] = useState<VendedorEfetivo[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [novo, setNovo] = useState<{ codigo: string; nome: string; setor: Setor }>({ codigo: "", nome: "", setor: "Outros" });

  useEffect(() => { if (open) setLista(vendedores.map((v) => ({ ...v }))); }, [open, vendedores]);

  const set = (codigo: string, patch: Partial<VendedorEfetivo>) =>
    setLista((cur) => cur.map((v) => (v.codigo === codigo ? { ...v, ...patch } : v)));

  const adicionar = () => {
    const codigo = novo.codigo.trim();
    if (!codigo || !novo.nome.trim()) { toast.error("Informe código e nome."); return; }
    if (lista.some((v) => v.codigo === codigo)) { toast.error("Código já existe."); return; }
    setLista((cur) => [...cur, { codigo, nome: novo.nome.trim().toUpperCase(), setor: novo.setor, ativo: true }]);
    setNovo({ codigo: "", nome: "", setor: "Outros" });
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
          <DialogDescription>Ative/inative vendedores, defina o setor e adicione novos. Inativos ficam fora dos cálculos, mas o histórico é preservado.</DialogDescription>
        </DialogHeader>

        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase text-[#5c6b4f] text-left">
                <th className="py-2">Vendedor</th><th className="py-2">Setor</th><th className="py-2 text-center">Ativo</th>
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
                  <td className="py-2 text-center">
                    <input type="checkbox" checked={v.ativo} onChange={(e) => set(v.codigo, { ativo: e.target.checked })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* adicionar novo */}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

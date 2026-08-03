// src/components/dashboard/EditarGruposModal.tsx
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MESES_LONGO, brl } from "@/lib/formato";
import type { GrupoSerie } from "@/data/planejamento2026";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ano: number;
  mes: number;
  series: GrupoSerie[];
  onSaved: () => void;
}

export const EditarGruposModal = React.memo(function EditarGruposModal({ open, onOpenChange, ano, mes, series, onSaved }: Props) {
  const [linhas, setLinhas] = useState<{ grupo: string; meta: number; realizado: number }[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLinhas(series.map((g) => ({ grupo: g.grupo, meta: g.metas[mes - 1] ?? 0, realizado: g.realizado[mes - 1] ?? 0 })));
  }, [open, series, mes]);

  const set = (grupo: string, campo: "meta" | "realizado", v: string) =>
    setLinhas((cur) => cur.map((l) => (l.grupo === grupo ? { ...l, [campo]: Number(v) || 0 } : l)));

  const salvar = async () => {
    setSalvando(true);
    try {
      const payload = linhas.map((l) => ({ grupo: l.grupo, ano, mes, meta: l.meta, realizado: l.realizado, updated_at: new Date().toISOString() }));
      const { error } = await supabase.from("grupos_financeiro").upsert(payload, { onConflict: "grupo,ano,mes" });
      if (error) throw error;
      toast.success("Grupos atualizados.");
      window.dispatchEvent(new CustomEvent("grupos-data-changed"));
      onSaved();
      onOpenChange(false);
    } catch (e) { toast.error("Erro ao salvar: " + (e as Error).message); }
    finally { setSalvando(false); }
  };

  const totMeta = linhas.reduce((s, l) => s + l.meta, 0);
  const totReal = linhas.reduce((s, l) => s + l.realizado, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[86vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-pasto-escuro">Editar Grupos — {MESES_LONGO[mes - 1]} {ano}</DialogTitle>
          <DialogDescription>Meta e faturamento realizado por grupo de produto. Alimenta os KPIs de CMV, Lucro e Margem.</DialogDescription>
        </DialogHeader>

        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase text-[#5c6b4f] text-left">
                <th className="py-2">Grupo</th><th className="py-2 text-right">Meta (R$)</th><th className="py-2 text-right">Realizado (R$)</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.grupo} className="border-t border-[#eef1eb]">
                  <td className="py-2 pr-2 font-medium">{l.grupo}</td>
                  <td className="py-2"><Input type="number" className="h-9 text-right" value={l.meta || ""} onChange={(e) => set(l.grupo, "meta", e.target.value)} /></td>
                  <td className="py-2"><Input type="number" className="h-9 text-right" value={l.realizado || ""} onChange={(e) => set(l.grupo, "realizado", e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold border-t-2 border-pasto-claro">
                <td className="py-2">TOTAL</td><td className="py-2 text-right">{brl(totMeta)}</td><td className="py-2 text-right">{brl(totReal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <DialogFooter className="mt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

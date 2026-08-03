// src/components/dashboard/ImportarDialog.tsx
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { brl2 } from "@/lib/formato";
import type { ResultadoImport } from "@/lib/importVendas";

interface Props {
  resultado: ResultadoImport | null;
  vendedores: { codigo: string; nome: string }[];
  onConfirmar: (assign: Record<string, string>) => void; // nome -> codigo | "ignorar"
  onCancelar: () => void;
  gravando: boolean;
}

export const ImportarDialog = React.memo(function ImportarDialog({ resultado, vendedores, onConfirmar, onCancelar, gravando }: Props) {
  const open = !!resultado;
  const [assign, setAssign] = useState<Record<string, string>>({});

  useEffect(() => {
    if (resultado) {
      const init: Record<string, string> = {};
      resultado.naoReconhecidos.forEach((r) => { init[r.nome] = "ignorar"; });
      setAssign(init);
    }
  }, [resultado]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancelar(); }}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-pasto-escuro">Revisão da importação</DialogTitle>
          <DialogDescription>Confira antes de gravar. Grava apenas a venda líquida do mês; um snapshot é criado para desfazer.</DialogDescription>
        </DialogHeader>

        {resultado && (
          <div className="overflow-auto flex-1 space-y-4 text-sm">
            <div className="text-xs text-muted-foreground">Aba escolhida: <strong>{resultado.abaEscolhida}</strong></div>

            <div>
              <div className="font-semibold text-[#1f7a1a] mb-1">Reconhecidos ({resultado.reconhecidos.length})</div>
              <div className="rounded-lg border border-border divide-y max-h-44 overflow-auto">
                {resultado.reconhecidos.map((r, i) => (
                  <div key={i} className="flex justify-between px-3 py-1.5"><span>{r.nome}</span><strong>{brl2(r.valor)}</strong></div>
                ))}
                {!resultado.reconhecidos.length && <div className="px-3 py-2 text-muted-foreground">Nenhum</div>}
              </div>
            </div>

            {resultado.combinados.length > 0 && (
              <div>
                <div className="font-semibold text-[#8a6d00] mb-1">Combinados ({resultado.combinados.length})</div>
                <div className="rounded-lg border border-[#f0e2a8] divide-y max-h-32 overflow-auto">
                  {resultado.combinados.map((r, i) => (
                    <div key={i} className="flex justify-between px-3 py-1.5"><span>{r.nome}</span><strong>{brl2(r.valor)}</strong></div>
                  ))}
                </div>
              </div>
            )}

            {resultado.naoReconhecidos.length > 0 && (
              <div>
                <div className="font-semibold text-[#b12318] mb-1">Nao reconhecidos ({resultado.naoReconhecidos.length}) - atribua ou ignore</div>
                <div className="rounded-lg border border-[#f5cfca] divide-y">
                  {resultado.naoReconhecidos.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 px-3 py-2">
                      <span className="flex-1 min-w-0 truncate">{r.nome} <span className="text-xs text-muted-foreground">- {brl2(r.valor)}</span></span>
                      <select
                        value={assign[r.nome] ?? "ignorar"}
                        onChange={(e) => setAssign((a) => ({ ...a, [r.nome]: e.target.value }))}
                        className="border border-border rounded-lg px-2 py-1.5 text-sm max-w-[220px]"
                      >
                        <option value="ignorar">Ignorar</option>
                        {vendedores.map((v) => <option key={v.codigo} value={v.codigo}>{v.nome}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="font-semibold mb-1">Diagnostico por aba</div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                {resultado.diagnostico.map((d, i) => (
                  <div key={i}>{d.aba}: score {Number.isFinite(d.pontuacao) ? d.pontuacao : "-"} - {d.reconhecidos} ok - {d.combinados} comb - {d.naoReconhecidos} nao - [{d.estrategia}]</div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={onCancelar} disabled={gravando}>Cancelar</Button>
          <Button onClick={() => onConfirmar(assign)} disabled={gravando}>
            {gravando ? "Gravando..." : "Confirmar e gravar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

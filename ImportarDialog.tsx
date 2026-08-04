// src/components/dashboard/ImportarDialog.tsx
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { brl2, MESES_LONGO } from "@/lib/formato";
import type { ResultadoImport } from "@/lib/importVendas";

interface Props {
  resultado: ResultadoImport | null;
  vendedores: { codigo: string; nome: string }[];
  ano: number;
  mesInicial: number;
  onConfirmar: (assign: Record<string, string>, mes: number) => void; // nome -> codigo | "ignorar" | "__criar__"
  onCancelar: () => void;
  gravando: boolean;
}

export const ImportarDialog = React.memo(function ImportarDialog({ resultado, vendedores, ano, mesInicial, onConfirmar, onCancelar, gravando }: Props) {
  const open = !!resultado;
  const [assign, setAssign] = useState<Record<string, string>>({});
  const [mes, setMes] = useState(mesInicial);

  useEffect(() => {
    if (resultado) {
      const init: Record<string, string> = {};
      resultado.naoReconhecidos.forEach((r) => { init[r.nome] = "ignorar"; });
      setAssign(init);
      setMes(mesInicial);
    }
  }, [resultado, mesInicial]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancelar(); }}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-pasto-escuro">Revisão da importação</DialogTitle>
          <DialogDescription>Confira antes de gravar. Grava apenas a venda líquida do mês; um snapshot é criado para desfazer.</DialogDescription>
        </DialogHeader>

        {resultado && (
          <div className="overflow-auto flex-1 space-y-4 text-sm">
            <div className="flex items-center gap-2 bg-pasto-claro/60 rounded-lg px-3 py-2">
              <span className="text-sm font-semibold text-primary">Fechamento do mês:</span>
              <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="border border-border rounded-lg px-2 py-1.5 text-sm font-medium">
                {MESES_LONGO.map((m, i) => <option key={i} value={i + 1}>{`${m}/${ano}`}</option>)}
              </select>
              <span className="text-xs text-muted-foreground">O valor será gravado neste mês.</span>
            </div>
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
                <div className="font-semibold text-[#b12318] mb-1">Novos na planilha ({resultado.naoReconhecidos.length}) — vincule a um vendedor do sistema</div>
                <div className="text-xs text-muted-foreground mb-2">Estes nomes vieram na planilha mas não existem no sistema. Escolha em quem lançar o valor de cada um, ou deixe em Ignorar.</div>
                <div className="rounded-lg border border-[#f5cfca] divide-y">
                  {resultado.naoReconhecidos.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 px-3 py-2">
                      <span className="flex-1 min-w-0 truncate">{r.nome} <span className="text-xs text-muted-foreground">- {brl2(r.valor)}</span></span>
                      <select
                        value={assign[r.nome] ?? "ignorar"}
                        onChange={(e) => setAssign((a) => ({ ...a, [r.nome]: e.target.value }))}
                        className="border border-border rounded-lg px-2 py-1.5 text-sm max-w-[240px]"
                      >
                        <option value="ignorar">Ignorar (não salva)</option>
                        <option value="__criar__">➕ Criar como novo vendedor</option>
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
          <Button onClick={() => onConfirmar(assign, mes)} disabled={gravando}>
            {gravando ? "Gravando..." : `Confirmar e gravar em ${MESES_LONGO[mes - 1]}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

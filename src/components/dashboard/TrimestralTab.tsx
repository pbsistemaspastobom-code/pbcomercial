// src/components/dashboard/TrimestralTab.tsx
import React, { useMemo } from "react";
import { LinhaLazy } from "@/components/dashboard/ChartsLazy";
import { diasUteisTrimestre } from "@/lib/diasUteis";
import { brl, pct, semaforo } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const semCor = { verde: "bg-[#e2f3e0] text-[#1f7a1a]", amarelo: "bg-[#fbf1c4] text-[#8a6d00]", vermelho: "bg-[#fbe0dd] text-[#b12318]" };

interface Props { ano: number; tris: { tri: number; nome: string; meta: number; venda: number; atingimento: number }[]; }

export const TrimestralTab = React.memo(function TrimestralTab({ ano, tris }: Props) {
  const linhas = useMemo(() => tris.map((t) => ({ ...t, realizado: t.venda, dias: diasUteisTrimestre(ano, t.tri).totais })), [tris, ano]);
  const serie = linhas.map((t) => ({ label: t.nome, Meta: t.meta, Realizado: t.realizado }));

  const exportar = () => {
    const rows = [["Trimestre", "Meta", "Realizado", "Atingimento %", "Dias uteis"]];
    linhas.forEach((t) => rows.push([t.nome, String(t.meta), String(t.realizado), t.atingimento.toFixed(1), String(t.dias)]));
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `trimestral_${ano}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-pasto-escuro font-semibold">Evolução trimestral</h3>
          <Button variant="outline" size="sm" onClick={exportar}><Download className="w-4 h-4" /> Exportar</Button>
        </div>
        <LinhaLazy data={serie} />
      </div>
      <div className="rounded-2xl border border-border bg-white p-5 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-pasto-claro text-[#3d5334]">
              <th className="text-left px-3 py-2">Trimestre</th>
              <th className="text-right px-3 py-2">Meta</th>
              <th className="text-right px-3 py-2">Realizado</th>
              <th className="text-right px-3 py-2">Atingimento</th>
              <th className="text-right px-3 py-2">Dias úteis</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((t) => {
              const sem = semaforo(t.atingimento);
              return (
                <tr key={t.nome} className="hover:bg-[#fafcf8]">
                  <td className="px-3 py-2 border-b border-[#eef1eb] font-medium">{t.nome}</td>
                  <td className="px-3 py-2 text-right border-b border-[#eef1eb]">{brl(t.meta)}</td>
                  <td className="px-3 py-2 text-right border-b border-[#eef1eb] font-semibold">{brl(t.realizado)}</td>
                  <td className="px-3 py-2 text-right border-b border-[#eef1eb]"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${semCor[sem]}`}>{pct(t.atingimento)}</span></td>
                  <td className="px-3 py-2 text-right border-b border-[#eef1eb]">{t.dias}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

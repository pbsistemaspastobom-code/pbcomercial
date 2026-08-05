// src/components/dashboard/TrimestralTab.tsx
import React, { useMemo } from "react";
import { LinhaLazy } from "@/components/dashboard/ChartsLazy";
import { agregarGrupos } from "@/lib/financeiro";
import { diasUteisTrimestre } from "@/lib/diasUteis";
import { brl, pct, semaforo } from "@/lib/formato";

const semCor = { verde: "bg-[#e2f3e0] text-[#1f7a1a]", amarelo: "bg-[#fbf1c4] text-[#8a6d00]", vermelho: "bg-[#fbe0dd] text-[#b12318]" };

export const TrimestralTab = React.memo(function TrimestralTab({ ano }: { ano: number }) {
  const tris = useMemo(() => {
    return [1, 2, 3, 4].map((q) => {
      const meses = [q * 3 - 2, q * 3 - 1, q * 3];
      const g = agregarGrupos(meses);
      const realizado = g.reduce((s, x) => s + x.realizado, 0);
      const meta = g.reduce((s, x) => s + x.meta, 0);
      const dias = diasUteisTrimestre(ano, q);
      return { nome: `Q${q}`, meta, realizado, atingimento: meta > 0 ? (realizado / meta) * 100 : 0, dias: dias.totais };
    });
  }, [ano]);

  const serie = tris.map((t) => ({ label: t.nome, Meta: t.meta, Realizado: t.realizado }));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-white p-5">
        <h3 className="text-pasto-escuro font-semibold mb-3">Evolução trimestral</h3>
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
            {tris.map((t) => {
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

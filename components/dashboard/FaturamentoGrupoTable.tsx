// src/components/dashboard/FaturamentoGrupoTable.tsx
import React from "react";
import { GRUPOS_DATA, type GrupoSerie } from "@/data/planejamento2026";
import { brl, pct } from "@/lib/formato";
import { MESES } from "@/lib/formato";

export const FaturamentoGrupoTable = React.memo(function FaturamentoGrupoTable({ series = GRUPOS_DATA }: { series?: GrupoSerie[] }) {
  const linhas = series.map((g) => {
    const total = g.realizado.reduce((s, v) => s + v, 0);
    const lucro = total * g.margem;
    return { grupo: g.grupo, meses: g.realizado, total, margem: g.margem * 100, lucro };
  });
  const lucroTotal = linhas.reduce((s, l) => s + l.lucro, 0) || 1;
  const totMes = MESES.map((_, i) => linhas.reduce((s, l) => s + l.meses[i], 0));
  const totGeral = linhas.reduce((s, l) => s + l.total, 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="sticky left-0 z-20 bg-pasto-claro text-left px-3 py-2 text-[#3d5334] font-semibold whitespace-nowrap">Grupo</th>
            {MESES.map((m) => <th key={m} className="bg-pasto-claro px-2 py-2 text-right text-[#3d5334] font-semibold">{m}</th>)}
            <th className="bg-pasto-claro px-3 py-2 text-right text-[#3d5334] font-semibold">Total</th>
            <th className="bg-pasto-claro px-2 py-2 text-right text-[#3d5334] font-semibold">Margem</th>
            <th className="bg-pasto-claro px-2 py-2 text-right text-[#3d5334] font-semibold">Contrib.</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.grupo} className="hover:bg-[#fafcf8]">
              <td className="sticky left-0 bg-white px-3 py-2 font-medium whitespace-nowrap border-b border-[#eef1eb]">{l.grupo}</td>
              {l.meses.map((v, i) => <td key={i} className="px-2 py-2 text-right border-b border-[#eef1eb] whitespace-nowrap">{brl(v)}</td>)}
              <td className="px-3 py-2 text-right font-semibold border-b border-[#eef1eb] whitespace-nowrap">{brl(l.total)}</td>
              <td className="px-2 py-2 text-right border-b border-[#eef1eb]">{pct(l.margem)}</td>
              <td className="px-2 py-2 text-right border-b border-[#eef1eb]">{pct((l.lucro / lucroTotal) * 100)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold bg-pasto-claro">
            <td className="sticky left-0 bg-pasto-claro px-3 py-2">TOTAL</td>
            {totMes.map((v, i) => <td key={i} className="px-2 py-2 text-right whitespace-nowrap">{brl(v)}</td>)}
            <td className="px-3 py-2 text-right whitespace-nowrap">{brl(totGeral)}</td>
            <td className="px-2 py-2"></td><td className="px-2 py-2 text-right">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
});

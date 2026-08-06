// src/components/dashboard/RankingTab.tsx
import React, { useMemo, useState } from "react";
import type { LinhaVendedor } from "@/hooks/useMetasData";
import { brl, pct, primeiroNome } from "@/lib/formato";
import { Trophy, Medal, Award } from "lucide-react";

const MEDAL = ["#E9C349", "#b8bcc4", "#cd7f32"]; // ouro, prata, bronze
const ICON = [Trophy, Medal, Award];

export function RankingTab({ linhas, periodoLabel }: { linhas: LinhaVendedor[]; periodoLabel?: string }) {
  const [criterio, setCriterio] = useState<"venda" | "atingimento">("venda");

  const ranked = useMemo(
    () => [...linhas].sort((a, b) => (criterio === "venda" ? b.vendaLiquida - a.vendaLiquida : b.atingimento - a.atingimento)),
    [linhas, criterio]
  );
  const top3 = ranked.slice(0, 3);
  const maxVenda = Math.max(...ranked.map((l) => l.vendaLiquida), 1);

  if (!linhas.length) {
    return (
      <div className="card-soft p-10 text-center text-ink-mute">
        Nenhum vendedor ainda. Importe uma planilha na aba <strong>Metas por Vendedor</strong> para montar o ranking.
      </div>
    );
  }

  return (
    <div>
      {/* Filtro de critério */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-sm text-ink-soft">Ordenar por:</span>
        <div className="inline-flex rounded-lg border border-border overflow-hidden">
          <button onClick={() => setCriterio("venda")} className={`px-4 py-1.5 text-sm font-medium ${criterio === "venda" ? "bg-primary text-white" : "bg-white text-ink-soft"}`}>Venda Líquida</button>
          <button onClick={() => setCriterio("atingimento")} className={`px-4 py-1.5 text-sm font-medium ${criterio === "atingimento" ? "bg-primary text-white" : "bg-white text-ink-soft"}`}>Atingimento %</button>
        </div>
        {periodoLabel && <span className="text-xs text-ink-mute ml-auto">{periodoLabel}</span>}
      </div>

      {/* Pódio Top 3 */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 0, 2].map((idx) => {
            const l = top3[idx]; if (!l) return <div key={idx} />;
            const Ico = ICON[idx];
            const alto = idx === 0;
            return (
              <div key={l.codigo} className={`card-soft p-5 text-center relative overflow-hidden ${alto ? "md:-mt-3" : ""}`}>
                <span className="absolute left-0 right-0 top-0 h-1.5" style={{ background: MEDAL[idx] }} />
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2" style={{ background: MEDAL[idx] + "22", color: MEDAL[idx] }}>
                  <Ico className="w-6 h-6" />
                </div>
                <div className="text-2xl font-extrabold font-headline text-primary">{idx + 1}º</div>
                <div className="font-semibold text-ink mt-1 truncate">{l.nome}</div>
                <div className="text-xs text-ink-mute">{l.setor}</div>
                <div className="mt-2 font-headline text-lg font-bold text-primary tnum">{brl(l.vendaLiquida)}</div>
                <div className="text-xs text-ink-mute tnum">{pct(l.atingimento)} da meta</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabela completa */}
      <div className="card-soft p-5">
        <h3 className="font-headline text-lg font-semibold text-primary mb-3">Classificação geral</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-ink-mute text-left border-b border-[#e9ecef]">
                <th className="py-2.5 w-10">#</th><th className="py-2.5">Vendedor</th><th className="py-2.5">Setor</th>
                <th className="py-2.5 text-right">Meta</th><th className="py-2.5 text-right">Venda Líquida</th>
                <th className="py-2.5">Progresso</th><th className="py-2.5 text-right">Atingimento</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((l, i) => {
                const cor = l.atingimento >= 100 ? "#1f7a1a" : l.atingimento >= 80 ? "#8a6d00" : "#d0342c";
                return (
                  <tr key={l.codigo} className="border-b border-[#f1f3f4]">
                    <td className="py-3 font-bold" style={{ color: i < 3 ? MEDAL[i] : "#717973" }}>{i + 1}º</td>
                    <td className="py-3 font-medium">{l.nome}</td>
                    <td className="py-3 text-ink-mute">{l.setor}</td>
                    <td className="py-3 text-right tnum">{brl(l.meta)}</td>
                    <td className="py-3 text-right tnum font-semibold">{brl(l.vendaLiquida)}</td>
                    <td className="py-3 w-40">
                      <div className="h-2 rounded-full bg-[#eef1eb] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min((l.vendaLiquida / maxVenda) * 100, 100)}%`, background: "#2d6a4f" }} />
                      </div>
                    </td>
                    <td className="py-3 text-right tnum font-bold" style={{ color: cor }}>{pct(l.atingimento)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

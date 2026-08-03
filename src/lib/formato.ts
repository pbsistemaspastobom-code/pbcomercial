// src/lib/formato.ts
export const brl = (v: number, max = 0) =>
  (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: max });
export const brl2 = (v: number) =>
  (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const pct = (v: number) =>
  `${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
export const kM = (v: number) => {
  const n = v || 0;
  if (Math.abs(n) >= 1e6) return `R$ ${(n / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`;
  if (Math.abs(n) >= 1e3) return `R$ ${(n / 1e3).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}K`;
  return `R$ ${n.toFixed(0)}`;
};
export const primeiroNome = (n: string) => {
  const p = n.trim().split(/\s+/);
  return p[0] + (p[1] ? " " + p[1].charAt(0) + "." : "");
};
export const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
export const MESES_LONGO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
export const semaforo = (atg: number): "verde" | "amarelo" | "vermelho" =>
  atg >= 100 ? "verde" : atg >= 80 ? "amarelo" : "vermelho";

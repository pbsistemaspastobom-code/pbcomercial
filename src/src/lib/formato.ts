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

/** Aceita "1500", "1.500", "1.500,50", "1500,5" etc. e devolve o número. */
export const parseBRL = (raw: string): number => {
  if (!raw) return 0;
  let s = raw.trim().replace(/[R$\s]/g, "");
  const temVirgula = s.includes(",");
  const temPonto = s.includes(".");
  if (temVirgula && temPonto) {
    // "1.500,50" -> ponto é milhar, vírgula é decimal
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (temVirgula) {
    // "1500,50" -> vírgula é decimal
    s = s.replace(",", ".");
  } else if (temPonto) {
    // ambíguo: "1.500" (milhar) vs "1500.50" (decimal) — só é decimal se tiver 1-2 dígitos depois do ponto E vier de teclado en-US
    const partes = s.split(".");
    const ultima = partes[partes.length - 1];
    if (partes.length > 2 || ultima.length === 3) s = s.replace(/\./g, ""); // milhar
    // senão mantém como decimal (ex: "1500.5")
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

/** Formata número para exibir no input de edição: "400000" -> "400.000" (sem símbolo R$). */
export const formatBRLInput = (v: number): string =>
  (v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });

// src/lib/diasUteis.ts
// Regra Pasto Bom: sábado é dia útil só de Jan a Abr/2026; domingo nunca; feriados nacionais fora.
export const FERIADOS_NACIONAIS: Record<number, string[]> = {
  2026: [
    "2026-01-01", "2026-04-03", "2026-04-21", "2026-05-01", "2026-06-04",
    "2026-09-07", "2026-10-12", "2026-11-02", "2026-11-15", "2026-11-20", "2026-12-25",
    // "2026-02-16","2026-02-17", // Carnaval (opcional)
  ],
};

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function ehDiaUtil(data: Date, ano = data.getFullYear()): boolean {
  if ((FERIADOS_NACIONAIS[ano] ?? []).includes(iso(data))) return false;
  const dow = data.getDay();
  if (dow === 0) return false;
  if (dow === 6) return data.getMonth() <= 3; // sáb útil só Jan–Abr
  return true;
}

export function contarDiasUteis(inicio: Date, fim: Date): number {
  let n = 0;
  const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  while (d <= fim) { if (ehDiaUtil(d)) n++; d.setDate(d.getDate() + 1); }
  return n;
}
export function diasUteisMes(ano: number, mes: number): number {
  return contarDiasUteis(new Date(ano, mes - 1, 1), new Date(ano, mes, 0));
}
export function diasUteisPassadosMes(ano: number, mes: number, hoje = new Date()): number {
  const inicio = new Date(ano, mes - 1, 1);
  const ultimo = new Date(ano, mes, 0);
  const limite = hoje < ultimo ? hoje : ultimo;
  if (limite < inicio) return 0;
  return contarDiasUteis(inicio, limite);
}
export function diasUteisAgregado(ano: number, meses: number[], hoje = new Date()) {
  let totais = 0, passados = 0;
  for (const m of meses) { totais += diasUteisMes(ano, m); passados += diasUteisPassadosMes(ano, m, hoje); }
  return { totais, passados, restantes: Math.max(totais - passados, 0) };
}
export function diasUteisTrimestre(ano: number, tri: number, hoje = new Date()) {
  const meses = [tri * 3 - 2, tri * 3 - 1, tri * 3];
  return diasUteisAgregado(ano, meses, hoje);
}

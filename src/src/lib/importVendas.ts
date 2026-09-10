// src/lib/importVendas.ts
// Importador de planilhas de vendas — regras completas (item 7) + amarração em etapas.
// Regra-mãe: sempre Venda Líquida, nunca Total de Venda ou Venda Bruta.
import * as XLSX from "xlsx";
import { VENDEDORES } from "@/data/planejamento2026";
import { ALIASES, COMBINE_VENDORS } from "@/data/resultados2026";

export interface LinhaImport { codigo: string; nome: string; valor: number; }
export interface DiagnosticoAba { aba: string; pontuacao: number; reconhecidos: number; combinados: number; naoReconhecidos: number; estrategia: string; }
export interface ResultadoImport {
  linhas: LinhaImport[];
  reconhecidos: { nome: string; codigo: string; valor: number }[];
  combinados: { nome: string; codigo: string; valor: number }[];
  naoReconhecidos: { nome: string; valor: number; codigo: string }[];
  diagnostico: DiagnosticoAba[];
  abaEscolhida: string;
}
export interface Vend { codigo: string; nome: string; }

const EXT_OK = ["xlsx", "xls", "xlsm", "xlsb", "csv", "ods", "et", "tsv"];

// ---------- normalização ----------
const norm = (s: unknown) =>
  String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

// ---------- parse de moeda ----------
export function parseMoeda(v: unknown): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  let s = String(v).replace(/r\$/gi, "").replace(/\s/g, "").trim();
  if (!s) return 0;
  s = s.replace(/[^\d.,-]/g, "");
  const lc = s.lastIndexOf(","), ld = s.lastIndexOf(".");
  if (lc > ld) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

// ---------- limpeza / validação de nome ----------
const limparCodigo = (raw: string) =>
  raw.replace(/^\s*\d{2,6}\s*[-–]\s*/, "").replace(/\s*[-–]\s*\d{2,6}\s*$/, "").trim();
const extrairCodigo = (raw: string): string => {
  const s = String(raw ?? "");
  const m = s.match(/[-–]\s*(\d{2,6})\s*$/) || s.match(/^\s*(\d{2,6})\s*[-–]/);
  return m ? m[1] : "";
};
function nomeValido(nome: string): boolean {
  const letras = (nome.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
  if (letras < 2) return false;
  const total = nome.replace(/\s/g, "").length || 1;
  return letras / total > 0.5;
}

// ---------- Levenshtein para fuzzy tolerante a troca de letra ----------
function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const d: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = d[0]; d[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return d[n];
}
const tokenSimilar = (t1: string, t2: string) =>
  t1 === t2 || t1.includes(t2) || t2.includes(t1) || (t1.length >= 4 && t2.length >= 4 && lev(t1, t2) <= 1);

// ---------- listas ----------
const COLS_NOME = ["vendedor", "colaborador", "nome", "funcionario", "representante", "consultor", "assessor", "atendente", "profissional", "responsavel", "seller", "name", "agente"];
const COLS_LIQUIDA = ["venda liquida", "vlr liquido", "valor liquido", "vl liquido", "liquido", "liquida"];
const COLS_FALLBACK = ["total", "faturamento", "receita", "resultado", "valor", "vendas", "venda", "vlr", "amount", "realizado", "real", "bruto", "revenue"];
const COLS_BLOCK = ["bruta", "bruto", "meta", "comissao", "devolucao", "imposto"];
const PULAR_INICIO = ["total", "subtotal", "resultado", "colaboradores", "comissao", "comissionamento", "geral", "equipe", "soma"];
const SUBROTULOS = ["soma", "vlr. agregado", "vlr agregado", "valor agregado", "media", "contagem", "count", "sum", "avg", "total geral"];
const bloqueada = (h: string) => COLS_BLOCK.some((b) => h.includes(b));
const ehLinhaPular = (nome: string) => {
  const n = norm(nome);
  if (n.endsWith("total")) return true;
  return PULAR_INICIO.some((t) => n === t || n.startsWith(t + " ") || n.startsWith(t));
};

// ---------- matcher (amarração automática em etapas) ----------
export interface Matcher { casar: (nomeRaw: string, codigoSheet?: string) => { codigo: string; combinado: boolean } | null; nomePorCodigo: Record<string, string>; }
export function criarMatcher(vendedores: Vend[]): Matcher {
  const nomePorCodigo: Record<string, string> = Object.fromEntries(vendedores.map((v) => [v.codigo, v.nome]));
  const porCodigo = new Set(vendedores.map((v) => v.codigo));
  const casar = (nomeRaw: string, codigoSheet?: string): { codigo: string; combinado: boolean } | null => {
    // 0) casa pelo CÓDIGO real da planilha (mais confiável)
    if (codigoSheet && porCodigo.has(codigoSheet)) return { codigo: codigoSheet, combinado: false };
    const n = norm(limparCodigo(nomeRaw));            // 1) limpa: código, acentos, espaços, minúsculo
    if (!n) return null;
    // 2) alias exato / combine exato (se houver)
    if (ALIASES[n]) return { codigo: ALIASES[n], combinado: false };
    if (COMBINE_VENDORS[n]) return { codigo: COMBINE_VENDORS[n], combinado: true };
    // 3) nome cadastrado (banco) EXATO
    const exato = vendedores.find((v) => norm(v.nome) === n);
    if (exato) return { codigo: exato.codigo, combinado: false };
    // Qualquer nome diferente (não idêntico e sem código) SEMPRE vai para a correlação manual.
    return null;
  };
  return { casar, nomePorCodigo };
}

// ---------- detecção de colunas ----------
function acharColNome(h: string[]): number { return h.findIndex((x) => COLS_NOME.some((k) => x.includes(k))); }
function acharColValor(h: string[]): number {
  for (let i = 0; i < h.length; i++) if (COLS_LIQUIDA.some((k) => h[i].includes(k)) && !bloqueada(h[i])) return i;
  for (let i = 0; i < h.length; i++) if (COLS_FALLBACK.some((k) => h[i].includes(k)) && !bloqueada(h[i])) return i;
  return -1;
}
const pareceNome = (c: unknown) => typeof c === "string" && nomeValido(limparCodigo(c)) && !/^\d+$/.test(String(c).trim());
const pareceValor = (c: unknown) => (typeof c === "number" && Number.isFinite(c)) || parseMoeda(c) > 0;

interface Deteccao { colNome: number; colVal: number; dataStart: number; estrategia: string; }
function detectar(grid: unknown[][], m: Matcher): Deteccao | null {
  const lim = Math.min(grid.length, 30);
  for (let i = 0; i < lim; i++) {
    const h = (grid[i] ?? []).slice(0, 30).map((c) => norm(c));
    const cn = acharColNome(h);
    if (cn < 0) continue;
    const cv = acharColValor(h);
    if (cv >= 0) return { colNome: cn, colVal: cv, dataStart: i + 1, estrategia: "cabecalho" };
  }
  const nCols = Math.min(30, Math.max(...grid.slice(0, lim).map((r) => (r ? r.length : 0)), 0));
  let par = { cn: -1, cv: -1, hits: 0 };
  for (let a = 0; a < nCols; a++) for (let b = 0; b < nCols; b++) {
    if (a === b) continue;
    let hits = 0;
    for (let i = 0; i < grid.length; i++) { const row = grid[i]; if (row && pareceNome(row[a]) && pareceValor(row[b])) hits++; }
    if (hits > par.hits) par = { cn: a, cv: b, hits };
  }
  if (par.hits >= 2) return { colNome: par.cn, colVal: par.cv, dataStart: 0, estrategia: "heuristica" };
  let mc = { c: -1, hits: 0 };
  for (let c = 0; c < nCols; c++) {
    let hits = 0;
    for (let i = 0; i < grid.length; i++) { const row = grid[i]; if (row && typeof row[c] === "string" && m.casar(String(row[c]))) hits++; }
    if (hits > mc.hits) mc = { c, hits };
  }
  if (mc.hits >= 2) {
    let colVal = -1, melhorNum = 0;
    for (let c = 0; c < nCols; c++) {
      if (c === mc.c) continue;
      let num = 0;
      for (let i = 0; i < grid.length; i++) { const row = grid[i]; if (row && pareceValor(row[c])) num++; }
      if (num > melhorNum) { melhorNum = num; colVal = c; }
    }
    if (colVal >= 0) return { colNome: mc.c, colVal, dataStart: 0, estrategia: "direta" };
  }
  return null;
}

interface AbaResultado {
  agg: Record<string, { nome: string; valor: number; combinado: boolean }>;
  naoRec: Record<string, { valor: number; codigo: string }>;
  reconhecidos: number; combinados: number; naoReconhecidos: number; estrategia: string;
}
function processarGrid(grid: unknown[][], m: Matcher): AbaResultado | null {
  const det = detectar(grid, m);
  if (!det) return null;
  const agg: AbaResultado["agg"] = {};
  const naoRec: Record<string, { valor: number; codigo: string }> = {};
  let carriedName = "";
  for (let i = det.dataStart; i < grid.length; i++) {
    const row = grid[i]; if (!row) continue;
    let nomeCel = String(row[det.colNome] ?? "").trim();
    if (!nomeCel) nomeCel = carriedName; else carriedName = nomeCel;
    if (!nomeCel) continue;
    const nlimpo = limparCodigo(nomeCel);
    const codigoSheet = extrairCodigo(nomeCel);
    if (SUBROTULOS.includes(norm(nomeCel)) || SUBROTULOS.includes(norm(nlimpo))) continue;
    if (ehLinhaPular(nlimpo)) continue;
    if (!nomeValido(nlimpo)) continue;
    const bruto = row[det.colVal];
    if (bruto == null || bruto === "") continue;
    const valor = parseMoeda(bruto);
    const mm = m.casar(nlimpo, codigoSheet);
    if (mm) {
      const nome = m.nomePorCodigo[mm.codigo] || nlimpo;
      const cur = (agg[mm.codigo] ??= { nome, valor: 0, combinado: mm.combinado });
      cur.valor += valor;
      if (mm.combinado) cur.combinado = true;
    } else {
      const e = (naoRec[nlimpo] ??= { valor: 0, codigo: codigoSheet });
      e.valor += valor;
      if (!e.codigo && codigoSheet) e.codigo = codigoSheet;
    }
  }
  const reconhecidos = Object.values(agg).filter((x) => !x.combinado).length;
  const combinados = Object.values(agg).filter((x) => x.combinado).length;
  return { agg, naoRec, reconhecidos, combinados, naoReconhecidos: Object.keys(naoRec).length, estrategia: det.estrategia };
}

export async function importarPlanilha(file: File, vendedores: Vend[] = VENDEDORES): Promise<ResultadoImport> {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!EXT_OK.includes(ext)) throw new Error(`Formato ".${ext}" não suportado`);
  const matcher = criarMatcher(vendedores.length ? vendedores : VENDEDORES);
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { raw: true });
  const diagnostico: DiagnosticoAba[] = [];
  let melhor: AbaResultado | null = null, melhorNome = "", melhorScore = -Infinity;
  for (const nomeAba of wb.SheetNames) {
    const grid = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[nomeAba], { header: 1, defval: null, raw: true });
    if (grid.length < 2) continue;
    const r = processarGrid(grid, matcher);
    if (!r) { diagnostico.push({ aba: nomeAba, pontuacao: -Infinity, reconhecidos: 0, combinados: 0, naoReconhecidos: 0, estrategia: "nenhuma" }); continue; }
    const score = r.reconhecidos * 10 + r.combinados * 4 - r.naoReconhecidos;
    diagnostico.push({ aba: nomeAba, pontuacao: score, reconhecidos: r.reconhecidos, combinados: r.combinados, naoReconhecidos: r.naoReconhecidos, estrategia: r.estrategia });
    if (score > melhorScore) { melhorScore = score; melhor = r; melhorNome = nomeAba; }
  }
  if (!melhor) throw new Error("Nenhuma aba reconhecida. Verifique o diagnóstico.");
  const linhas = Object.entries(melhor.agg).map(([codigo, x]) => ({ codigo, nome: x.nome, valor: x.valor }));
  return {
    linhas,
    reconhecidos: Object.entries(melhor.agg).filter(([, x]) => !x.combinado).map(([codigo, x]) => ({ nome: x.nome, codigo, valor: x.valor })),
    combinados: Object.entries(melhor.agg).filter(([, x]) => x.combinado).map(([codigo, x]) => ({ nome: x.nome, codigo, valor: x.valor })),
    naoReconhecidos: Object.entries(melhor.naoRec).map(([nome, x]) => ({ nome, valor: x.valor, codigo: x.codigo })),
    diagnostico,
    abaEscolhida: melhorNome,
  };
}

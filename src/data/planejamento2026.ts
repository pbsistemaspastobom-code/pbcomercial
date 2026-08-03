// src/data/planejamento2026.ts
export type Setor = "Loja Balcão" | "Campo Agrícola" | "Campo Pecuária" | "Oficina" | "Outros";
export const SETORES: Setor[] = ["Loja Balcão", "Campo Agrícola", "Campo Pecuária", "Oficina", "Outros"];

export interface VendedorPlano {
  codigo: string; nome: string; setor: Setor; ativo: boolean; metas: number[];
}

const mkMetas = (base: number) => Array(12).fill(base);
export const VENDEDORES: VendedorPlano[] = [
  { codigo: "00046", nome: "MAURICIO RABELO DE ALMEIDA", setor: "Campo Agrícola", ativo: true, metas: mkMetas(830000) },
  { codigo: "00008", nome: "RITA DE CASSIA FERREIRA E SILVA", setor: "Loja Balcão", ativo: true, metas: mkMetas(520000) },
  { codigo: "00037", nome: "MARIO SERGIO DIAS", setor: "Campo Agrícola", ativo: true, metas: mkMetas(190000) },
  { codigo: "00044", nome: "CESAR AUGUSTO MARTINS DA SILVEIRA", setor: "Campo Pecuária", ativo: true, metas: mkMetas(168000) },
  { codigo: "00050", nome: "FABIO AUGUSTO DIAS", setor: "Campo Agrícola", ativo: true, metas: mkMetas(125000) },
  { codigo: "00012", nome: "PAMELA CAMILLE XAVIER COUTINHO", setor: "Loja Balcão", ativo: true, metas: mkMetas(103000) },
  { codigo: "00026", nome: "DYENIFER VITORIA COSTA MATEUS", setor: "Loja Balcão", ativo: true, metas: mkMetas(89000) },
  { codigo: "00004", nome: "ROBERTO AUGUSTO GONÇALVES ANDRADE", setor: "Oficina", ativo: true, metas: mkMetas(73000) },
  { codigo: "00005", nome: "CELIO APARECIDO FRANCO JUNIOR", setor: "Campo Agrícola", ativo: true, metas: mkMetas(24000) },
  { codigo: "00048", nome: "MARCUS JOSE DA COSTA DE OLIVEIRA", setor: "Campo Agrícola", ativo: true, metas: mkMetas(24000) },
  { codigo: "00053", nome: "VINICIUS DE OLIVEIRA NOVAIS", setor: "Oficina", ativo: true, metas: mkMetas(9800) },
  { codigo: "00054", nome: "MATEUS RESPLANTE SILVA", setor: "Loja Balcão", ativo: true, metas: mkMetas(2000) },
  { codigo: "00001", nome: "DIEGO APARECIDO DA SILVA", setor: "Outros", ativo: true, metas: mkMetas(3000) },
  { codigo: "00052", nome: "JOSE APARECIDO DE BRITO JUNIOR", setor: "Outros", ativo: true, metas: mkMetas(1300) },
  { codigo: "00055", nome: "GABRIELY RODRIGUES LAZAROTI", setor: "Loja Balcão", ativo: true, metas: mkMetas(2400) },
  { codigo: "00007", nome: "ISABELLA FERREIRA DA COSTA", setor: "Loja Balcão", ativo: false, metas: mkMetas(0) },
];
export const PLANO_POR_CODIGO: Record<string, VendedorPlano> = Object.fromEntries(VENDEDORES.map((v) => [v.codigo, v]));

export const GRUPOS = ["Fertilizante Agrícola", "Agrícola", "Máquinas", "Nutrição Animal", "Varejo", "Pecuária", "Serviços", "Pet"] as const;
export type Grupo = (typeof GRUPOS)[number];

export interface GrupoSerie { grupo: Grupo; metas: number[]; realizado: number[]; margem: number; }
const SAZONAL = [0.9, 0.85, 1.0, 1.05, 1.1, 1.0, 1.0, 0.95, 1.05, 1.1, 1.0, 1.0];
const serie = (base: number) => SAZONAL.map((f) => Math.round(base * f));
const G = (grupo: Grupo, base: number, margem: number, fMeta: number): GrupoSerie => ({
  grupo, margem, realizado: serie(base), metas: serie(base * fMeta),
});
export const GRUPOS_DATA: GrupoSerie[] = [
  G("Fertilizante Agrícola", 260000, 0.18, 1.10),
  G("Agrícola", 210000, 0.28, 1.08),
  G("Máquinas", 60000, 0.14, 1.20),
  G("Nutrição Animal", 120000, 0.22, 1.05),
  G("Varejo", 95000, 0.32, 1.05),
  G("Pecuária", 80000, 0.24, 1.10),
  G("Serviços", 25000, 0.55, 1.00),
  G("Pet", 30000, 0.38, 1.05),
];

export const FIN = { despesasGeraisPct: 0.18 };

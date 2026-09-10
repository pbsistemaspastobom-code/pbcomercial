// src/data/planejamento2026.ts
export type Setor = "Loja Balcão" | "Campo Agrícola" | "Campo Pecuária" | "Oficina" | "Outros";
export const SETORES: Setor[] = ["Loja Balcão", "Campo Agrícola", "Campo Pecuária", "Oficina", "Outros"];

export interface VendedorPlano {
  codigo: string; nome: string; setor: Setor; ativo: boolean; metas: number[];
}

const mkMetas = (base: number) => Array(12).fill(base);
export const VENDEDORES: VendedorPlano[] = []; // vazio: vendedores vêm só do banco (planilha)
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
  G("Fertilizante Agrícola", 0, 0.18, 1.10),
  G("Agrícola", 0, 0.28, 1.08),
  G("Máquinas", 0, 0.14, 1.20),
  G("Nutrição Animal", 0, 0.22, 1.05),
  G("Varejo", 0, 0.32, 1.05),
  G("Pecuária", 0, 0.24, 1.10),
  G("Serviços", 0, 0.55, 1.00),
  G("Pet", 0, 0.38, 1.05),
];

export const FIN = { despesasGeraisPct: 0.18 };

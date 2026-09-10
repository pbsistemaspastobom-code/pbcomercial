// src/data/resultados2026.ts
// Apelidos fixos e combinações para o importador.
// Mapeiam um texto (já normalizado: minúsculo, sem acento) para o CÓDIGO do vendedor destino.

// Códigos: Marcus José=00048, Isabella Ferreira=00007, César Augusto=00044, Roberto Augusto=00004
export const ALIASES: Record<string, string> = {
  "kito": "00048",                      // kito -> Marcus José
  "ecommerce": "00007",                 // ecommerce -> Isabella Ferreira
  "e-commerce": "00007",
  "diego": "00007",                     // diego (canal ecommerce) -> Isabella Ferreira
  "locacao de equipamentos": "00044",   // locação de equipamentos -> César Augusto
  "locacao": "00044",
  "beatriz": "00004",                   // beatriz -> Roberto Augusto
};

// combineVendors: nomes que somam num destino e são reportados como "combinados".
// (mesma ideia dos aliases, porém contabilizados separadamente no score.)
export const COMBINE_VENDORS: Record<string, string> = {
  // "fulano do balcao": "00012",
};

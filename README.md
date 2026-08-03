# Portal Comercial · Pasto Bom — Módulo Dashboard de Planejamento

App React + Vite + TypeScript, **sem login**, pronto para Supabase + Netlify. Build validado (`npm run build` OK). Recharts carregado sob demanda (fora do bundle inicial).

## Cobertura do spec (todas as 11 seções)
1. **Cabeçalho** — título, subtítulo do período, seletor de mês, toggle Mensal/Anual, "Limpar Memória" (limpa cache/localStorage/sessionStorage, preserva banco), botão atualizar.
2. **8 KPIs** — Faturamento, Meta, Atingimento %, Lucro Bruto, Margem Bruta %, CMV (valor e %), Despesas Gerais (valor e %), Lucro Líquido (valor e %), com semáforo.
3. **Gráficos** — barras Meta×Faturamento (por mês na visão anual, por grupo na mensal) e pizza de lucro por grupo. `isAnimationActive={false}` e **Recharts em lazy import**.
4. **Tabela por grupo** — 12 meses + total + margem + contribuição, cabeçalho sticky, rolagem horizontal, total no rodapé.
5. **Metas por Vendedor** — tabela agrupada por setor com Meta, Venda Líquida, Atingimento, Falta, Média/dia útil, Ritmo necessário, Projeção, Projeção %; subtotais por setor e total geral; inativos fora dos cálculos. Botões: Editar (grava cada tecla em `useRef`), Salvar/Cancelar, Importar, Desfazer, Histórico (30 snapshots), Somar Meses, Gerenciar Equipe, Exportar Excel, Ocultar Valores.
6. **Trimestral** — Q1–Q4 automáticos (meta, realizado, atingimento, dias úteis) + gráfico de linha.
7. **Importador** — varre todas as abas e pontua (reconhecidos×10 + combinados×4 − não reconhecidos), acha cabeçalho em 30×30, prioriza "Venda Líquida", descarta bruta/meta/comissão/devolução/imposto, trata pivô (arrasta nome, ignora subrótulos), limpa códigos, pula totais, soma duplicados, match fuzzy, parser de moeda tolerante, e diálogo de revisão com snapshot antes de gravar.
8. **Dias úteis** — utilitário central: sábado só Jan–Abr, feriados nacionais fora.
9. **Performance** — code-splitting do Recharts, React.memo em tabelas/gráficos, cache com staleTime/gcTime, sem refetch no foco, contador de requisição (race), timeout de 4s, limpeza a cada 10 min em requestIdleCallback.
10. **Banco** — `metas_vendedores`, `vendedores_config`, `metas_historico` (snapshots JSON), RLS + GRANTs, upsert em lote, evento `metas-data-changed`.
11. **Erros** — try/catch + toast em toda requisição; diálogos com descrição sr-only.

## Subir (resumo)
1. **Supabase:** rode `supabase/migrations/20260801_planejamento.sql` no SQL Editor.
2. **Credenciais:** `public/env.js` (drag-and-drop) ou `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (deploy via Git).
3. **Netlify:** build `npm run build`, publish `dist` (já no `netlify.toml`).

## Rodar local
```bash
npm install
npm run dev
```

## Ajustes esperados
- `src/data/planejamento2026.ts`: metas por vendedor, setores, e os grupos de produto (realizado/meta/margem) são **exemplos** — troque pelos números reais. CMV/despesas/lucro derivam das margens dos grupos + `FIN.despesasGeraisPct`.
- Feriados em `src/lib/diasUteis.ts` (Carnaval comentado).
- O app está **sem login** e a migração libera `anon` (leitura+escrita) conforme o spec. Se quiser travar escrita, ajuste as policies.

## Observações honestas
- Números financeiros e grupos de produto são exemplos porque o export do ORIX não traz CMV, despesas nem grupo — precisam vir de config estática (feito aqui) ou de outra fonte no banco.
- "Gerenciar Equipe" funcional (vendedores_config) e "Editar Grupos" funcional (grupos_financeiro). O app lê ambos sobre os dados estáticos.
- Bundle principal grande por causa do `xlsx`; se quiser, dá pra carregar o importador sob demanda também.

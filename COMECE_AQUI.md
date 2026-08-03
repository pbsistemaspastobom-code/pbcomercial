# COMECE AQUI — Portal Comercial Pasto Bom

Sistema pronto para rodar. Build validado. Siga os passos na ordem.

## 1) Rodar local (para testar já)
```bash
npm install
npm run dev
```
Abre em http://localhost:5173. Sem login — cai direto no dashboard.
> Para o app ler/gravar dados, configure o Supabase (passo 2). Sem isso, ele abre e mostra a interface, mas não grava.

## 2) Supabase (banco)
1. Crie um projeto em https://supabase.com (recomendado: **separado** do Portal antigo).
2. SQL Editor → cole e rode `supabase/migrations/20260801_planejamento.sql`.
   - É idempotente (pode rodar de novo sem quebrar). Cria: `metas_vendedores`, `vendedores_config`, `grupos_financeiro`, `metas_historico`.
3. Project Settings → API → copie a **Project URL** e a **anon key**.

## 3) Credenciais
- **Rodando local ou deploy drag-and-drop:** edite `public/env.js` com URL e anon key.
- **Deploy via Git no Netlify:** defina em Site settings → Environment:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## 4) Netlify (produção)
- **Git:** build `npm run build`, publish `dist` (já no `netlify.toml`).
- **Drag-and-drop:** `npm run build` local e arraste a pasta `dist`.

## 5) Roteiro de teste (5 min)
1. Abra o app → aba **Visão Geral**: veja os 8 KPIs financeiros, gráficos e a tabela por grupo.
2. **Editar Grupos** → mude meta/realizado de um grupo → salve → veja CMV/Lucro/Margem mudarem.
3. Aba **Vendedores**: troque o mês e o filtro de vendedor → faróis e gráficos recalculam.
4. **Gerenciar Equipe** → inative alguém → ele some dos cálculos; adicione um novo.
5. **Importar** uma planilha do ORIX → confira reconhecidos/combinados → atribua os não reconhecidos → confirme (cria snapshot; grava só a venda líquida do mês).
6. **Histórico** → restaure um snapshot. **Somar Meses** → selecione vários meses (edição/import desabilitam).
7. Aba **Trimestral**: Q1–Q4 automáticos.

## 6) Trocar os dados de exemplo pelos reais
Edite `src/data/planejamento2026.ts`:
- Metas por vendedor e setores.
- Margens por grupo e base dos grupos (ou edite pelo botão **Editar Grupos** direto no app, que grava no banco).
Aliases de importação: `src/data/resultados2026.ts`.
Feriados: `src/lib/diasUteis.ts`.

Pronto. Qualquer erro no deploy, me manda o print que eu corrijo.

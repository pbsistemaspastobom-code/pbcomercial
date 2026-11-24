# Portal Comercial Pasto Bom (PB Comercial)
React 18 + Vite 6 + TypeScript + Tailwind 3 + Supabase. Deploy: GitHub -> Cloudflare Workers (`npm run build`).
- Sempre responder em português do Brasil. Usar "Venda Líquida" (nunca Total/Bruta).
- Dias úteis: src/lib/diasUteis.ts (sábado conta só Jan–Abr; domingo nunca; 20/11/2026 NÃO é descontado).
- Repo: github.com/pbsistemaspastobom-code/pbcomercial. Alias `@/` = src/.
- Variáveis: VITE_SUPABASE_URL (sem /rest/v1/) e chave anon, em public/env.js ou ambiente.

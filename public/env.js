// Configuração em tempo de execução (runtime).
// Use este arquivo quando fizer deploy por DRAG-AND-DROP no Netlify (sem rebuild).
// Edite os valores abaixo com o projeto Supabase correto e faça o upload da pasta dist.
// (Se usar deploy via Git, prefira as variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no Netlify.)
window.__ENV__ = {
  SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
  SUPABASE_ANON_KEY: "SUA-ANON-KEY-AQUI",
};

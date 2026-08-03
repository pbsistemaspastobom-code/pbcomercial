// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

declare global {
  interface Window { __ENV__?: { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string }; }
}
const url = window.__ENV__?.SUPABASE_URL || (import.meta.env.VITE_SUPABASE_URL as string) || "";
const anonKey = window.__ENV__?.SUPABASE_ANON_KEY || (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "";

if (!url || !anonKey) {
  console.error("[Supabase] Configuração ausente. Preencha public/env.js ou as variáveis VITE_SUPABASE_*.");
}
export const supabase = createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } });

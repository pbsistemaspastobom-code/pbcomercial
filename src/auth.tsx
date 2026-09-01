// src/auth.tsx — controle de acesso (login, papéis e permissões)
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Papel = "admin" | "gerencia" | "supervisao" | "vendedor";
export interface Usuario { usuario: string; papel: Papel; codigo_vendedor: string | null; }

interface AuthCtx {
  user: Usuario | null;
  login: (u: string, s: string) => Promise<boolean>;
  logout: () => void;
  carregando: boolean;
}
const Ctx = createContext<AuthCtx | null>(null);
export const useAuth = () => { const c = useContext(Ctx); if (!c) throw new Error("useAuth fora do provider"); return c; };

const KEY = "pb_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setUser(JSON.parse(raw)); } catch { /* ignore */ }
    setCarregando(false);
  }, []);

  const login = async (u: string, s: string) => {
    const { data, error } = await supabase.rpc("fazer_login", { p_usuario: u, p_senha: s });
    if (error || !data || !data.length) return false;
    const usr = data[0] as Usuario;
    setUser(usr);
    try { localStorage.setItem(KEY, JSON.stringify(usr)); } catch { /* ignore */ }
    return true;
  };
  const logout = () => { setUser(null); try { localStorage.removeItem(KEY); } catch { /* ignore */ } };

  return <Ctx.Provider value={{ user, login, logout, carregando }}>{children}</Ctx.Provider>;
}

export function usePermissoes() {
  const { user } = useAuth();
  const papel = user?.papel;
  return {
    papel,
    ehAdmin: papel === "admin",
    podeGerenciarUsuarios: papel === "admin",
    podeEditar: papel === "admin" || papel === "gerencia", // editar, importar, criar vendedores
    soLeitura: papel === "supervisao",
    ehVendedor: papel === "vendedor",
    codigoVendedor: user?.codigo_vendedor ?? null,
  };
}

const PAPEL_LABEL: Record<Papel, string> = { admin: "Administrador", gerencia: "Gerência", supervisao: "Supervisão", vendedor: "Vendedor" };
export const rotuloPapel = (p?: string) => (p ? PAPEL_LABEL[p as Papel] ?? p : "");

export function Login() {
  const { login } = useAuth();
  const [u, setU] = useState("");
  const [s, setS] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const entrar = async () => {
    if (!u.trim() || !s) { setErro("Preencha usuário e senha."); return; }
    setCarregando(true); setErro("");
    const ok = await login(u.trim(), s);
    if (!ok) { setErro("Usuário ou senha inválidos."); setCarregando(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6f3] p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#e6e9e3] overflow-hidden">
        <div className="bg-[#012d1d] px-8 py-8 text-center">
          <div className="bg-white rounded-xl px-3 py-3 inline-flex"><img src="/logo.png" alt="Pasto Bom" className="h-10 object-contain" /></div>
          <div className="text-white font-semibold mt-4">Portal Comercial</div>
          <div className="text-white/60 text-xs">Pasto Bom · Rede do Campo</div>
        </div>
        <div className="p-8 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#3a4730] uppercase tracking-wide">Usuário</label>
            <input value={u} onChange={(e) => setU(e.target.value)} onKeyDown={(e) => e.key === "Enter" && entrar()}
              className="mt-1 w-full h-11 rounded-lg border border-[#d6dbd2] px-3 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/40" autoFocus />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#3a4730] uppercase tracking-wide">Senha</label>
            <input type="password" value={s} onChange={(e) => setS(e.target.value)} onKeyDown={(e) => e.key === "Enter" && entrar()}
              className="mt-1 w-full h-11 rounded-lg border border-[#d6dbd2] px-3 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/40" />
          </div>
          {erro && <div className="text-sm text-[#b12318] bg-[#fbe0dd] rounded-lg px-3 py-2">{erro}</div>}
          <button onClick={entrar} disabled={carregando}
            className="w-full h-11 rounded-lg bg-[#2d6a4f] hover:bg-[#245c43] text-white font-semibold disabled:opacity-60">
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

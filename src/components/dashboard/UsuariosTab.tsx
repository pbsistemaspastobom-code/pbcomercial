// src/components/dashboard/UsuariosTab.tsx — cadastro de usuários (admin)
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2, UserPlus, KeyRound } from "lucide-react";
import type { VendedorEfetivo } from "@/hooks/useMetasData";
import { rotuloPapel, type Papel } from "@/auth";

interface UsuarioRow { usuario: string; papel: string; codigo_vendedor: string | null; ativo: boolean; }
const PAPEIS: Papel[] = ["admin", "gerencia", "supervisao", "vendedor"];

export function UsuariosTab({ vendedores }: { vendedores: VendedorEfetivo[] }) {
  const [lista, setLista] = useState<UsuarioRow[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [novo, setNovo] = useState({ usuario: "", senha: "", papel: "vendedor" as Papel, codigo: "" });
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    const { data, error } = await supabase.rpc("listar_usuarios");
    if (error) toast.error("Erro ao carregar: " + error.message);
    else setLista((data ?? []) as UsuarioRow[]);
    setCarregando(false);
  };
  useEffect(() => { carregar(); }, []);

  const salvar = async () => {
    if (!novo.usuario.trim() || !novo.senha) { toast.error("Informe usuário e senha."); return; }
    if (novo.papel === "vendedor" && !novo.codigo) { toast.error("Selecione o vendedor vinculado."); return; }
    setSalvando(true);
    const { error } = await supabase.rpc("salvar_usuario", {
      p_usuario: novo.usuario.trim(), p_senha: novo.senha, p_papel: novo.papel, p_codigo: novo.codigo || "",
    });
    if (error) toast.error("Erro ao salvar: " + error.message);
    else { toast.success("Usuário salvo."); setNovo({ usuario: "", senha: "", papel: "vendedor", codigo: "" }); carregar(); }
    setSalvando(false);
  };

  const excluir = async (usuario: string) => {
    if (usuario.toLowerCase() === "admin") { toast.error("Não é possível excluir o admin principal."); return; }
    const { error } = await supabase.rpc("excluir_usuario", { p_usuario: usuario });
    if (error) toast.error("Erro: " + error.message);
    else { setLista((c) => c.filter((x) => x.usuario !== usuario)); toast.success("Usuário excluído."); }
  };

  const alternarAtivo = async (u: UsuarioRow) => {
    if (u.usuario.toLowerCase() === "admin" && u.ativo) { toast.error("Não é possível inativar o admin principal."); return; }
    const { error } = await supabase.rpc("definir_ativo", { p_usuario: u.usuario, p_ativo: !u.ativo });
    if (error) toast.error("Erro: " + error.message);
    else { setLista((c) => c.map((x) => (x.usuario === u.usuario ? { ...x, ativo: !u.ativo } : x))); toast.success(u.ativo ? "Usuário inativado." : "Usuário ativado."); }
  };

  const resetarSenha = async (usuario: string) => {
    const nova = window.prompt(`Nova senha para "${usuario}":`);
    if (nova == null) return;
    if (!nova.trim()) { toast.error("Senha vazia."); return; }
    const { error } = await supabase.rpc("redefinir_senha", { p_usuario: usuario, p_senha: nova });
    if (error) toast.error("Erro: " + error.message);
    else toast.success("Senha redefinida.");
  };

  const nomeVend = (cod: string | null) => (cod ? vendedores.find((v) => v.codigo === cod)?.nome ?? cod : "—");

  return (
    <div className="space-y-5">
      {/* Novo usuário */}
      <div className="card-soft p-5">
        <h3 className="font-headline text-lg font-semibold text-primary mb-3">Novo usuário</h3>
        <div className="grid md:grid-cols-5 gap-3">
          <input placeholder="Usuário" value={novo.usuario} onChange={(e) => setNovo({ ...novo, usuario: e.target.value })} className="h-10 rounded-lg border border-border px-3 text-sm" />
          <input placeholder="Senha" type="text" value={novo.senha} onChange={(e) => setNovo({ ...novo, senha: e.target.value })} className="h-10 rounded-lg border border-border px-3 text-sm" />
          <select value={novo.papel} onChange={(e) => setNovo({ ...novo, papel: e.target.value as Papel, codigo: e.target.value === "vendedor" ? novo.codigo : "" })} className="h-10 rounded-lg border border-border px-2 text-sm">
            {PAPEIS.map((p) => <option key={p} value={p}>{rotuloPapel(p)}</option>)}
          </select>
          <select value={novo.codigo} onChange={(e) => setNovo({ ...novo, codigo: e.target.value })} disabled={novo.papel !== "vendedor"} className="h-10 rounded-lg border border-border px-2 text-sm disabled:bg-[#f1f3f0] disabled:text-ink-mute">
            <option value="">{novo.papel === "vendedor" ? "Vincular vendedor…" : "—"}</option>
            {vendedores.map((v) => <option key={v.codigo} value={v.codigo}>{v.nome}</option>)}
          </select>
          <Button onClick={salvar} disabled={salvando} className="bg-primary hover:bg-primary-dark text-white"><UserPlus className="w-4 h-4" /> {salvando ? "Salvando..." : "Adicionar"}</Button>
        </div>
        <p className="text-xs text-ink-mute mt-2">Vendedor só enxerga o resultado geral e o dele. Supervisão só visualiza. Gerência faz tudo, menos criar usuário. Admin faz tudo.</p>
      </div>

      {/* Lista */}
      <div className="card-soft p-5">
        <h3 className="font-headline text-lg font-semibold text-primary mb-3">Usuários</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-ink-mute text-left border-b border-[#e9ecef]">
                <th className="py-2.5">Usuário</th><th className="py-2.5">Papel</th><th className="py-2.5">Vendedor vinculado</th><th className="py-2.5 text-center">Status</th><th className="py-2.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? <tr><td colSpan={5} className="py-4 text-ink-mute">Carregando…</td></tr> :
                lista.map((u) => (
                  <tr key={u.usuario} className="border-b border-[#f1f3f4]">
                    <td className="py-3 font-medium">{u.usuario}</td>
                    <td className="py-3">{rotuloPapel(u.papel)}</td>
                    <td className="py-3 text-ink-mute">{nomeVend(u.codigo_vendedor)}</td>
                    <td className="py-3 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${u.ativo ? "bg-[#e2f3e0] text-[#1f7a1a]" : "bg-[#eceeef] text-ink-mute"}`}>{u.ativo ? "ATIVO" : "INATIVO"}</span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => alternarAtivo(u)} className="text-xs px-2 py-1 rounded border border-border hover:bg-[#f0f4ee]" title={u.ativo ? "Inativar" : "Ativar"}>{u.ativo ? "Inativar" : "Ativar"}</button>
                        <button onClick={() => resetarSenha(u.usuario)} className="text-primary p-1.5 rounded hover:bg-[#f0f4ee]" title="Redefinir senha"><KeyRound className="w-4 h-4" /></button>
                        <button onClick={() => excluir(u.usuario)} className="text-[#b12318] p-1.5 rounded hover:bg-[#fbe0dd]" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!carregando && !lista.length && <tr><td colSpan={5} className="py-4 text-ink-mute">Nenhum usuário.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

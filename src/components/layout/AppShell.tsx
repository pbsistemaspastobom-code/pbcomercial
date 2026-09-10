// src/components/layout/AppShell.tsx
import React from "react";
import { LayoutDashboard, Target, Trophy, BarChart3, Users, UserCog, LogOut, Menu } from "lucide-react";
import type { Papel } from "@/auth";
import { rotuloPapel } from "@/auth";

export type NavKey = "dashboard" | "metas" | "ranking" | "trimestral" | "relatorios" | "equipe" | "usuarios";

const NAV: { key: NavKey; label: string; icon: React.ReactNode; papeis: Papel[] }[] = [
  { key: "dashboard", label: "Painel Geral", icon: <LayoutDashboard className="w-[18px] h-[18px]" />, papeis: ["admin", "gerencia", "supervisao", "vendedor"] },
  { key: "metas", label: "Metas por Vendedor", icon: <Target className="w-[18px] h-[18px]" />, papeis: ["admin", "gerencia", "supervisao", "vendedor"] },
  { key: "ranking", label: "Ranking", icon: <Trophy className="w-[18px] h-[18px]" />, papeis: ["admin", "gerencia", "supervisao"] },
  { key: "trimestral", label: "Trimestral", icon: <BarChart3 className="w-[18px] h-[18px]" />, papeis: ["admin", "gerencia", "supervisao"] },
  { key: "equipe", label: "Gerenciar Equipe", icon: <Users className="w-[18px] h-[18px]" />, papeis: ["admin", "gerencia", "supervisao"] },
  { key: "usuarios", label: "Usuários", icon: <UserCog className="w-[18px] h-[18px]" />, papeis: ["admin"] },
];

interface Props {
  active: NavKey;
  onNavigate: (k: NavKey) => void;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  papel: Papel;
  usuarioNome: string;
  onLogout: () => void;
  hideActionsOnMobile?: boolean;
}

export function AppShell({ active, onNavigate, title, subtitle, actions, children, papel, usuarioNome, onLogout, hideActionsOnMobile }: Props) {
  const [aberto, setAberto] = React.useState(false);
  const itens = NAV.filter((n) => n.papeis.includes(papel));
  const tabsMobile = itens.slice(0, 4);
  const extrasMobile = itens.slice(4);

  const Sidebar = (
    <aside className="w-[260px] shrink-0 bg-white border-r border-[#E9ECEF] flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 pt-6 pb-5">
        <img src="/logo.png" alt="Rede do Campo — Pasto Bom" className="h-9 object-contain" />
      </div>

      {/* Card usuário */}
      <div className="px-4 mb-2">
        <div className="rounded-xl bg-[#F1F5EF] px-3 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary text-white font-bold flex items-center justify-center uppercase text-xs shrink-0">{usuarioNome.slice(0, 2)}</div>
          <div className="leading-tight min-w-0">
            <div className="font-semibold text-sm text-ink truncate">{usuarioNome}</div>
            <div className="text-[11px] text-ink-mute truncate">{rotuloPapel(papel)}</div>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-4 py-2 space-y-1">
        {itens.map((item) => {
          const on = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => { onNavigate(item.key); setAberto(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
                on ? "bg-[#D8F3DC] text-primary-dark" : "text-ink-soft hover:bg-[#F1F5EF]"
              }`}
            >
              <span className={on ? "text-primary" : "text-ink-mute"}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Rodapé */}
      <div className="px-4 pb-5 pt-2 border-t border-[#E9ECEF]">
        <button onClick={onLogout} className="w-full rounded-full hover:bg-[#F1F5EF] px-4 py-2.5 text-ink-soft hover:text-ink text-sm font-semibold flex items-center gap-3 transition-colors">
          <LogOut className="w-[18px] h-[18px] text-ink-mute" /> Sair
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar desktop */}
      <div className="hidden lg:flex h-full">{Sidebar}</div>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topo */}
        <header className="relative z-30 shrink-0 bg-white border-b border-[#E9ECEF] px-4 lg:px-10 py-3 lg:py-5 flex items-center gap-3">
          <div className="lg:hidden w-9 h-9 rounded-lg bg-primary-dark flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="" className="h-5 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-headline text-lg lg:text-[26px] font-extrabold text-ink tracking-tight truncate">{title}</h1>
            {subtitle && <p className="hidden lg:block text-[11px] font-bold text-ink-mute uppercase tracking-wide truncate mt-0.5">{subtitle}</p>}
          </div>
          {extrasMobile.length > 0 && (
            <button onClick={() => setAberto(true)} className="lg:hidden w-9 h-9 rounded-full bg-[#F1F5EF] flex items-center justify-center shrink-0" title="Mais opções">
              <Menu className="w-[18px] h-[18px] text-ink-soft" />
            </button>
          )}
          <button onClick={onLogout} className="lg:hidden w-9 h-9 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase" title="Sair">{usuarioNome.slice(0, 2)}</button>
          {actions && <div className="hidden lg:flex items-center gap-2 flex-wrap justify-end">{actions}</div>}
        </header>
        {actions && !hideActionsOnMobile && <div className="lg:hidden px-4 pt-3 flex items-center gap-2 flex-wrap">{actions}</div>}

        {/* Área rolável */}
        <main className="relative z-0 flex-1 overflow-auto px-4 lg:px-10 py-4 lg:py-6 pb-24 lg:pb-6">
          <div className="max-w-[1440px] mx-auto">{children}</div>
        </main>
      </div>

      {/* Barra inferior (mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E9ECEF] flex items-stretch pb-[env(safe-area-inset-bottom)]">
        {tabsMobile.map((item) => {
          const on = active === item.key;
          return (
            <button key={item.key} onClick={() => onNavigate(item.key)} className="flex-1 flex flex-col items-center gap-0.5 py-2.5">
              <span className={on ? "text-primary" : "text-ink-mute"}>{item.icon}</span>
              <span className={`text-[10px] font-bold ${on ? "text-primary" : "text-ink-mute"}`}>{item.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>

      {/* Painel "mais" (mobile) — itens extras além da barra inferior */}
      {aberto && (
        <div className="lg:hidden fixed inset-0 z-40 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAberto(false)} />
          <div className="relative w-full bg-white rounded-t-2xl p-4 space-y-1">
            {extrasMobile.map((item) => (
              <button key={item.key} onClick={() => { onNavigate(item.key); setAberto(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${active === item.key ? "bg-[#D8F3DC] text-primary-dark" : "text-ink-soft"}`}>
                {item.icon} {item.label}
              </button>
            ))}
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-ink-soft"><LogOut className="w-[18px] h-[18px]" /> Sair</button>
          </div>
        </div>
      )}
    </div>
  );
}

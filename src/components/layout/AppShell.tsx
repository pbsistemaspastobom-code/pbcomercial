// src/components/layout/AppShell.tsx
import React from "react";
import { LayoutDashboard, Target, BarChart3, Users, LogOut, Menu, X } from "lucide-react";

export type NavKey = "dashboard" | "metas" | "relatorios" | "equipe";

const NAV: { key: NavKey; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", label: "Painel Geral", icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
  { key: "metas", label: "Metas por Vendedor", icon: <Target className="w-[18px] h-[18px]" /> },
  { key: "relatorios", label: "Relatórios", icon: <BarChart3 className="w-[18px] h-[18px]" /> },
  { key: "equipe", label: "Gerenciar Equipe", icon: <Users className="w-[18px] h-[18px]" /> },
];

interface Props {
  active: NavKey;
  onNavigate: (k: NavKey) => void;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ active, onNavigate, title, subtitle, actions, children }: Props) {
  const [aberto, setAberto] = React.useState(false);

  const Sidebar = (
    <aside className="w-[280px] shrink-0 bg-primary-dark text-white flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 pt-6 pb-5">
        <div className="bg-white rounded-xl px-3 py-2.5 flex items-center justify-center">
          <img src="/logo.png" alt="Rede do Campo — Pasto Bom" className="h-9 object-contain" />
        </div>
      </div>

      {/* Card usuário */}
      <div className="px-4">
        <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/90 text-primary-dark font-bold flex items-center justify-center">PB</div>
          <div className="leading-tight min-w-0">
            <div className="font-semibold text-sm truncate">Portal Comercial</div>
            <div className="text-[11px] text-white/60 truncate">Pasto Bom · Rede do Campo</div>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-4 py-5 space-y-1">
        {NAV.map((item) => {
          const on = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => { onNavigate(item.key); setAberto(false); }}
              className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                on ? "bg-primary-active text-white" : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              {on && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-gold" />}
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Rodapé */}
      <div className="px-4 pb-5">
        <div className="rounded-lg border border-white/10 px-4 py-3 text-white/60 text-xs flex items-center gap-2">
          <LogOut className="w-4 h-4" /> Sistema sem login (acesso interno)
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar desktop */}
      <div className="hidden lg:flex h-full">{Sidebar}</div>

      {/* Sidebar mobile (drawer) */}
      {aberto && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAberto(false)} />
          <div className="relative h-full">{Sidebar}</div>
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topo */}
        <header className="shrink-0 bg-surface/80 backdrop-blur border-b border-[#e9ecef] px-5 lg:px-10 py-4 flex items-center gap-4">
          <button className="lg:hidden text-ink" onClick={() => setAberto(true)}><Menu className="w-6 h-6" /></button>
          <div className="flex-1 min-w-0">
            <h1 className="font-headline text-2xl font-semibold text-primary tracking-tight truncate">{title}</h1>
            {subtitle && <p className="text-sm text-ink-soft truncate">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-wrap justify-end">{actions}</div>}
        </header>

        {/* Área rolável */}
        <main className="flex-1 overflow-auto px-5 lg:px-10 py-6">
          <div className="max-w-[1440px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

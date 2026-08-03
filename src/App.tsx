import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import Dashboard from "@/pages/Dashboard";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 60_000, gcTime: 5 * 60_000 } },
});

function Topbar() {
  return (
    <div className="sticky top-0 z-20 bg-white border-b border-border px-6 py-3 flex items-center gap-3">
      <img src="/logo.png" alt="Rede do Campo — Pasto Bom" className="h-8" />
      <div className="leading-tight">
        <div className="text-pasto-escuro font-bold text-base">Portal Comercial · Pasto Bom</div>
        <div className="text-xs text-muted-foreground">Gestão de metas e indicadores</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen">
        <Topbar />
        <Dashboard />
      </div>
    </QueryClientProvider>
  );
}

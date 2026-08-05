// src/components/dashboard/Header.tsx
import React from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eraser, RefreshCw } from "lucide-react";
import { MESES_LONGO } from "@/lib/formato";

interface Props {
  ano: number;
  mes: number;
  onMes: (m: number) => void;
  visao: "mensal" | "anual";
  onVisao: (v: "mensal" | "anual") => void;
  periodoLabel: string;
}

export const Header = React.memo(function Header({ ano, mes, onMes, visao, onVisao, periodoLabel }: Props) {
  const queryClient = useQueryClient();

  const limparMemoria = () => {
    queryClient.clear();
    try {
      Object.keys(localStorage).filter((k) => k.startsWith("pb_") || k.startsWith("metas") || k.startsWith("dashboard")).forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch { /* storage indisponível */ }
    window.dispatchEvent(new CustomEvent("metas-data-changed"));
    toast.success("Memória limpa. Dados do banco preservados.");
  };
  const atualizar = () => {
    queryClient.invalidateQueries();
    toast.success("Recarregando do banco...");
  };

  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-pasto-escuro">Dashboard de Planejamento</h1>
        <p className="text-muted-foreground uppercase tracking-wide text-sm mt-1">{periodoLabel}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={String(mes)} onValueChange={(v) => onMes(Number(v))}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Mês" /></SelectTrigger>
          <SelectContent>
            {MESES_LONGO.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{`${m}/${ano}`}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="inline-flex rounded-lg border border-border overflow-hidden">
          <button onClick={() => onVisao("mensal")} className={`px-4 h-10 text-sm font-semibold ${visao === "mensal" ? "bg-pasto-escuro text-white" : "bg-white text-[#3a4730]"}`}>Mensal</button>
          <button onClick={() => onVisao("anual")} className={`px-4 h-10 text-sm font-semibold ${visao === "anual" ? "bg-pasto-escuro text-white" : "bg-white text-[#3a4730]"}`}>Anual</button>
        </div>
        <Button variant="outline" onClick={limparMemoria} title="Limpar memória"><Eraser className="w-4 h-4" /> Limpar Memória</Button>
        <Button variant="outline" size="icon" onClick={atualizar} title="Atualizar"><RefreshCw className="w-4 h-4" /></Button>
      </div>
    </div>
  );
});

// src/components/InstallPrompt.tsx — botão explícito de instalação do PWA
import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    const jaInstalado = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
    if (jaInstalado) return;
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setEvt(null));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!evt || !visivel) return null;

  const instalar = async () => {
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    if (outcome === "accepted") setEvt(null);
  };

  return (
    <div className="fixed bottom-20 lg:bottom-5 left-4 right-4 lg:left-auto lg:right-5 lg:w-80 z-50">
      <div className="bg-primary-dark text-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden">
          <img src="/icon-192.png" alt="" className="w-8 h-8 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">Instalar PB Comercial</div>
          <div className="text-white/60 text-xs">Acesse direto da tela inicial</div>
        </div>
        <button onClick={instalar} className="bg-white text-primary-dark font-bold text-xs px-3 py-2 rounded-lg shrink-0 flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Instalar</button>
        <button onClick={() => setVisivel(false)} className="text-white/50 shrink-0" title="Fechar"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

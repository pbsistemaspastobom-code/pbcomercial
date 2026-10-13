// src/components/ui/currency-input.tsx
import React, { useEffect, useRef, useState } from "react";
import { parseBRL, formatBRLInput } from "@/lib/formato";

interface Props {
  defaultValue: number;
  onChange: (v: number) => void;
  className?: string;
}

/**
 * Campo de valor: aceita ponto e vírgula livremente (400000, 400.000, 1.500,50).
 * Enquanto o campo está em foco, o texto é do usuário (não é reformatado a cada tecla);
 * ao sair do campo, formata no padrão brasileiro.
 */
export function CurrencyInput({ defaultValue, onChange, className }: Props) {
  const [texto, setTexto] = useState(formatBRLInput(defaultValue));
  const emFoco = useRef(false);

  // só sincroniza com o valor de fora quando o usuário NÃO está digitando
  useEffect(() => {
    if (!emFoco.current) setTexto(formatBRLInput(defaultValue));
  }, [defaultValue]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={texto}
      onChange={(e) => {
        const v = e.target.value;
        setTexto(v);
        onChange(parseBRL(v));
      }}
      onFocus={(e) => {
        emFoco.current = true;
        e.target.select();
      }}
      onBlur={() => {
        emFoco.current = false;
        setTexto(formatBRLInput(parseBRL(texto)));
      }}
      className={className}
    />
  );
}

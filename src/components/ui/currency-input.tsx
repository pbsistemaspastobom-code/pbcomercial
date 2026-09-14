// src/components/ui/currency-input.tsx
import React, { useEffect, useState } from "react";
import { parseBRL, formatBRLInput } from "@/lib/formato";

interface Props {
  defaultValue: number;
  onChange: (v: number) => void;
  className?: string;
}

/** Campo de valor: aceita ponto e vírgula livremente (ex: 400000, 400.000, 1.500,50) e formata ao sair do campo. */
export function CurrencyInput({ defaultValue, onChange, className }: Props) {
  const [texto, setTexto] = useState(formatBRLInput(defaultValue));

  useEffect(() => { setTexto(formatBRLInput(defaultValue)); }, [defaultValue]);

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
      onBlur={() => setTexto(formatBRLInput(parseBRL(texto)))}
      onFocus={(e) => e.target.select()}
      className={className}
    />
  );
}

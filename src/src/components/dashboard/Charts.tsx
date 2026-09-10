// src/components/dashboard/Charts.tsx  (carregado via React.lazy)
import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { brl2, kM } from "@/lib/formato";

const VERDE = "#2D6A27", CLARO = "#D6EDD3", AMAR = "#E8B800";
const PAL = ["#2D6A27", "#3A7D2E", "#5a9a3f", "#7bb356", "#9ccb70", "#E8B800", "#c9a227", "#b0c299"];
const tip = { contentStyle: { borderRadius: 10, border: "1px solid #e6eae1", fontSize: 12 } };

export interface BarPoint { label: string; Meta: number; Faturamento: number; }
export const BarrasMetaFat = React.memo(function BarrasMetaFat({ data }: { data: BarPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1ea" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={data.length > 6 ? -30 : 0} textAnchor={data.length > 6 ? "end" : "middle"} height={data.length > 6 ? 70 : 30} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={kM} />
        <Tooltip {...tip} formatter={(v: number) => brl2(v)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Meta" fill={CLARO} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="Faturamento" fill={VERDE} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
});

export interface VendedorBarPoint { label: string; Meta: number; Venda: number; }
export const BarrasVendedor = React.memo(function BarrasVendedor({ data }: { data: VendedorBarPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1ea" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={data.length > 6 ? -30 : 0} textAnchor={data.length > 6 ? "end" : "middle"} height={data.length > 6 ? 70 : 30} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={kM} />
        <Tooltip {...tip} formatter={(v: number) => brl2(v)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Meta" fill={CLARO} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="Venda" fill={VERDE} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
});

export interface PiePoint { name: string; value: number; }
export const PizzaLucro = React.memo(function PizzaLucro({ data }: { data: PiePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={115} innerRadius={58} paddingAngle={2}
          isAnimationActive={false} label={(e: { percent?: number }) => `${((e.percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
          {data.map((_, i) => <Cell key={i} fill={PAL[i % PAL.length]} />)}
        </Pie>
        <Tooltip {...tip} formatter={(v: number) => brl2(v)} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
});

export interface LinePoint { label: string; Meta: number; Realizado: number; }
export const LinhaTrimestral = React.memo(function LinhaTrimestral({ data }: { data: LinePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1ea" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={kM} />
        <Tooltip {...tip} formatter={(v: number) => brl2(v)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="Meta" stroke={AMAR} strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="Realizado" stroke={VERDE} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
});

"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { RegistroAntropometrico } from "@/types";

export function EvolutionChart({ dados }: { dados: RegistroAntropometrico[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 8, right: 16, bottom: 16, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5efe9" />
          <XAxis
            dataKey="data"
            tick={{ fontSize: 12 }}
            stroke="#7a8f83"
            label={{ value: "Data", position: "insideBottom", offset: -4, fontSize: 12, fill: "#7a8f83" }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#7a8f83"
            label={{ value: "kg  ·  IMC", angle: -90, position: "insideLeft", fontSize: 12, fill: "#7a8f83" }}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, borderColor: "#d6ebe0", fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="pesoKg"
            name="Peso (kg)"
            stroke="#2E6B4F"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="imc"
            name="IMC"
            stroke="#7fbe9d"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

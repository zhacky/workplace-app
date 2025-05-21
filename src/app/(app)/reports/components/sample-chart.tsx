
// src/app/(app)/reports/components/sample-chart.tsx
"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"

const chartData = [
  { month: "January", revenue: 1860, bookings: 80 },
  { month: "February", revenue: 3050, bookings: 200 },
  { month: "March", revenue: 2370, bookings: 120 },
  { month: "April", revenue: 7300, bookings: 190 },
  { month: "May", revenue: 2090, bookings: 130 },
  { month: "June", revenue: 2140, bookings: 140 },
];

const chartConfig = {
  revenue: {
    label: "Revenue (₱)",
    color: "hsl(var(--chart-1))",
  },
  bookings: {
    label: "Bookings",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface SampleChartProps {
  title: string;
  dataKey: "revenue" | "bookings";
}

export function SampleChart({ title, dataKey }: SampleChartProps) {
  const config = { [dataKey]: chartConfig[dataKey] } as ChartConfig;
  
  return (
    <ChartContainer config={config} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            // stroke="hsl(var(--foreground))"
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            // stroke="hsl(var(--foreground))"
            />
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Legend content={<ChartLegendContent />} />
          <Bar 
            dataKey={dataKey} 
            fill={`var(--color-${dataKey})`}
            radius={4} 
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

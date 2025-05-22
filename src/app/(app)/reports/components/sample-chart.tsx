
// src/app/(app)/reports/components/sample-chart.tsx
"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

interface ChartDataItem {
  month: string;
  [key: string]: string | number; // Allows for dynamic keys like 'revenue' or 'bookings'
}

interface SampleChartProps {
  chartData: ChartDataItem[];
  chartConfig: ChartConfig;
  dataKey: string; // e.g., "revenue" or "bookings"
}

export function SampleChart({ chartData, chartConfig, dataKey }: SampleChartProps) {
  // The chartConfig passed in should be specific to the dataKey being displayed
  // e.g., for revenue: { revenue: { label: "Revenue (₱)", color: "hsl(var(--chart-1))" } }
  
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            // stroke="hsl(var(--foreground))" // Uses theme by default
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            // stroke="hsl(var(--foreground))" // Uses theme by default
          />
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Legend content={<ChartLegendContent />} />
          <Bar 
            dataKey={dataKey} 
            fill={`var(--color-${dataKey})`} // Relies on CSS variable structured as --color-datakey
            radius={4} 
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

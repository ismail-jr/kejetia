"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Calendar } from "lucide-react";

interface MonthlyPerformanceChartProps {
  data: { month: string; earnings: number; bookings: number }[];
}

const SENTINEL = "rgb(1, 2, 3)";

function useThemeColors() {
  const [colors, setColors] = useState({
    primary: "#9c1f3e", // matches your light-mode crimson as a safe fallback
    secondary: "#f59e0b", // matches your --color-warning amber as a safe fallback
    border: "#e5e7eb",
    mutedForeground: "#6b7280",
    card: "#ffffff",
  });

  useEffect(() => {
    const resolve = () => {
      const probe = document.createElement("div");
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      probe.style.pointerEvents = "none";
      document.body.appendChild(probe);

      const read = (
        varName: string,
        prop: "color" | "backgroundColor",
        fallback: string,
      ) => {
        probe.style.color = SENTINEL;
        probe.style.backgroundColor = SENTINEL;
        probe.style[prop] = `var(${varName})`;
        const computed = getComputedStyle(probe)[prop];
        return computed && computed !== SENTINEL ? computed : fallback;
      };

      // Every token in this project is namespaced --color-*, not bare
      // --primary/--border/etc. Reading the wrong name silently falls
      // back rather than erroring, which is exactly what was happening.
      setColors({
        primary: read("--color-primary", "color", "#9c1f3e"),
        // --color-warning (amber) is already designed in this theme to
        // contrast against the crimson primary — no new token needed.
        secondary: read("--color-warning", "color", "#f59e0b"),
        border: read("--color-border", "color", "#e5e7eb"),
        mutedForeground: read("--color-muted-foreground", "color", "#6b7280"),
        card: read("--color-card", "backgroundColor", "#ffffff"),
      });

      document.body.removeChild(probe);
    };

    resolve();

    const observer = new MutationObserver(resolve);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return colors;
}

function CustomTooltip({ active, payload, label, colors }: any) {
  if (active && payload && payload.length) {
    return (
      <div
        className="border border-border rounded-xl p-3 shadow-lg"
        style={{ backgroundColor: colors.card }}
      >
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <div className="space-y-1 mt-2">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.primary }}
            />
            Earnings:{" "}
            <span className="font-semibold text-foreground">
              GH₵{payload[0]?.value ?? 0}
            </span>
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.secondary }}
            />
            Bookings:{" "}
            <span className="font-semibold text-foreground">
              {payload[1]?.value ?? 0}
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export function MonthlyPerformanceChart({
  data,
}: MonthlyPerformanceChartProps) {
  const colors = useThemeColors();
  const hasData = data.some((d) => d.earnings > 0 || d.bookings > 0);

  if (!hasData) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
        <Calendar className="w-12 h-12 mb-3 opacity-20" />
        <p className="text-sm">No data available for the selected period</p>
        <p className="text-xs">Complete bookings to see your performance</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={colors.border}
          opacity={0.6}
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: colors.mutedForeground }}
          axisLine={{ stroke: colors.border }}
          tickLine={{ stroke: colors.border }}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 12, fill: colors.mutedForeground }}
          axisLine={{ stroke: colors.border }}
          tickLine={{ stroke: colors.border }}
          label={{
            value: "Earnings (GH₵)",
            angle: -90,
            position: "insideLeft",
            fontSize: 11,
            fill: colors.mutedForeground,
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 12, fill: colors.mutedForeground }}
          axisLine={{ stroke: colors.border }}
          tickLine={{ stroke: colors.border }}
          label={{
            value: "Bookings",
            angle: 90,
            position: "insideRight",
            fontSize: 11,
            fill: colors.mutedForeground,
          }}
        />
        <Tooltip
          content={<CustomTooltip colors={colors} />}
          cursor={{ fill: colors.border, opacity: 0.15 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
          iconType="circle"
          formatter={(value) => (
            <span className="text-foreground font-medium">{value}</span>
          )}
        />
        <Bar
          yAxisId="left"
          dataKey="earnings"
          name="Earnings"
          fill={colors.primary}
          radius={[4, 4, 0, 0]}
          barSize={32}
          fillOpacity={0.9}
        />
        <Bar
          yAxisId="right"
          dataKey="bookings"
          name="Bookings"
          fill={colors.secondary}
          radius={[4, 4, 0, 0]}
          barSize={32}
          fillOpacity={0.9}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DashboardChartPoint } from "../hooks/useDashboardData"

export const description = "An interactive area chart"

const chartConfig = {
  incoming: {
    label: "Laporan Masuk",
    color: "#000000",
  },
  resolved: {
    label: "Selesai",
    color: "#4b5563",
  },
} satisfies ChartConfig

type ChartAreaInteractiveProps = {
  data: DashboardChartPoint[];
  loading?: boolean;
};

const getReferenceDate = (items: DashboardChartPoint[]) => {
  const last = items.at(-1);
  return last ? new Date(last.date) : new Date();
};

const filterByRange = (
  items: DashboardChartPoint[],
  range: string,
  referenceDate: Date
) => {
  const days = range === "30d" ? 30 : range === "7d" ? 7 : 90;
  const startDate = new Date(referenceDate);
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - days + 1);

  return items.filter((item) => {
    const date = new Date(item.date);
    date.setHours(0, 0, 0, 0);
    return date >= startDate && date <= referenceDate;
  });
};

export function ChartAreaInteractive({ data, loading }: ChartAreaInteractiveProps) {
  const [timeRange, setTimeRange] = React.useState("90d")
  const normalizedData = data
  const referenceDate = React.useMemo(
    () => getReferenceDate(normalizedData),
    [normalizedData]
  )

  const filteredData = React.useMemo(
    () => filterByRange(normalizedData, timeRange, referenceDate),
    [normalizedData, referenceDate, timeRange]
  )

  const hasData = filteredData.length > 0

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b p-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Pergerakan laporan jalan</CardTitle>
          <CardDescription>
            Tren laporan masuk dan selesai berdasarkan data Supabase
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder="3 bulan terakhir" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              3 bulan terakhir
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              30 hari terakhir
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              7 hari terakhir
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {hasData ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillIncoming" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#000000"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="#000000"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#4b5563"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="#4b5563"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("id-ID", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("id-ID", {
                        month: "short",
                        day: "numeric",
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="incoming"
                type="natural"
                fill="url(#fillIncoming)"
                stroke="#000000"
                strokeWidth={2}
                stackId="a"
              />
              <Area
                dataKey="resolved"
                type="natural"
                fill="url(#fillResolved)"
                stroke="#4b5563"
                strokeWidth={2}
                stackId="a"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[250px] w-full items-center justify-center rounded-lg border text-sm text-muted-foreground">
            {loading ? 'Memuat data laporan...' : 'Belum ada data laporan untuk rentang ini.'}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

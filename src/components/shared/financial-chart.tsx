'use client'

import * as React from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { ChartSkeleton } from '@/components/shared/loading-skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type FinancialChartType = 'line' | 'bar' | 'pie' | 'area'

interface ChartDataItem {
  label: string
  value: number
  secondaryValue?: number
  fill?: string
  category?: string
  [key: string]: unknown
}

interface FinancialChartProps {
  type: FinancialChartType
  data: ChartDataItem[]
  title?: string
  description?: string
  dataKey?: string
  secondaryDataKey?: string
  xAxisKey?: string
  config?: ChartConfig
  loading?: boolean
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  colors?: string[]
  className?: string
  children?: React.ReactNode
}

const DEFAULT_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#6b7280',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#8b5cf6',
]

export function FinancialChart({
  type,
  data,
  title,
  description,
  dataKey = 'value',
  secondaryDataKey = 'secondaryValue',
  xAxisKey = 'label',
  config,
  loading = false,
  height = 280,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  colors = DEFAULT_COLORS,
  className,
}: FinancialChartProps) {
  const chartConfig: ChartConfig = React.useMemo(
    () =>
      config ?? {
        [dataKey]: {
          label: dataKey.charAt(0).toUpperCase() + dataKey.slice(1),
          color: colors[0],
        },
        ...(secondaryDataKey
          ? {
              [secondaryDataKey]: {
                label:
                  secondaryDataKey.charAt(0).toUpperCase() +
                  secondaryDataKey.slice(1),
                color: colors[1],
              },
            }
          : {}),
      },
    [config, dataKey, secondaryDataKey, colors],
  )

  if (loading) {
    return <ChartSkeleton className={className} />
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
            )}
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) =>
                typeof v === 'number'
                  ? v >= 1000
                    ? `$${(v / 1000).toFixed(0)}k`
                    : `$${v}`
                  : v
              }
            />
            {showTooltip && (
              <ChartTooltip content={<ChartTooltipContent />} />
            )}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            {secondaryDataKey && (
              <Line
                type="monotone"
                dataKey={secondaryDataKey}
                stroke={colors[1]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
          </LineChart>
        )

      case 'area':
        return (
          <AreaChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
            )}
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) =>
                typeof v === 'number'
                  ? v >= 1000
                    ? `$${(v / 1000).toFixed(0)}k`
                    : `$${v}`
                  : v
              }
            />
            {showTooltip && (
              <ChartTooltip content={<ChartTooltipContent />} />
            )}
            <defs>
              <linearGradient id={dataKey} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={colors[0]}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={colors[0]}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              strokeWidth={2}
              fill={`url(#${dataKey})`}
            />
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
            )}
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) =>
                typeof v === 'number'
                  ? v >= 1000
                    ? `$${(v / 1000).toFixed(0)}k`
                    : `$${v}`
                  : v
              }
            />
            {showTooltip && (
              <ChartTooltip content={<ChartTooltipContent />} />
            )}
            <Bar dataKey={dataKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        )

      case 'pie':
        return (
          <PieChart>
            {showTooltip && (
              <ChartTooltip content={<ChartTooltipContent />} />
            )}
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey={dataKey}
              nameKey={xAxisKey}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={
                    (data[index]?.fill as string) ??
                    colors[index % colors.length]
                  }
                />
              ))}
            </Pie>
          </PieChart>
        )

      default:
        return null
    }
  }

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader className="pb-2">
          {title && <CardTitle className="text-base">{title}</CardTitle>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
      )}
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto w-full">
          <div style={{ height }}>
            {renderChart()}
          </div>
        </ChartContainer>
        {showLegend && type === 'pie' && (
          <ChartLegend content={<ChartLegendContent nameKey={xAxisKey} />} />
        )}
      </CardContent>
    </Card>
  )
}

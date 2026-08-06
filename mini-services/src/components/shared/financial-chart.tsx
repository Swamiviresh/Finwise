'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
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

function PremiumTooltipContent(props: React.ComponentProps<typeof ChartTooltipContent>) {
  return (
    <div className="rounded-xl border-border/40 bg-background/90 p-3 shadow-xl shadow-black/[0.06] backdrop-blur-xl">
      <ChartTooltipContent {...props} className="rounded-lg" />
    </div>
  )
}

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
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} />
            )}
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12, fill: 'oklch(0.55 0.02 260)' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12, fill: 'oklch(0.55 0.02 260)' }}
              tickFormatter={(v) =>
                typeof v === 'number'
                  ? v >= 1000
                    ? `$${(v / 1000).toFixed(0)}k`
                    : `$${v}`
                  : v
              }
            />
            {showTooltip && (
              <ChartTooltip content={<PremiumTooltipContent />} />
            )}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: colors[0], fill: 'var(--background)' }}
              animationDuration={800}
              animationEasing="ease-out"
            />
            {secondaryDataKey && (
              <Line
                type="monotone"
                dataKey={secondaryDataKey}
                stroke={colors[1]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: colors[1], fill: 'var(--background)' }}
                animationDuration={800}
                animationEasing="ease-out"
                animationBegin={100}
              />
            )}
          </LineChart>
        )

      case 'area':
        return (
          <AreaChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} />
            )}
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12, fill: 'oklch(0.55 0.02 260)' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12, fill: 'oklch(0.55 0.02 260)' }}
              tickFormatter={(v) =>
                typeof v === 'number'
                  ? v >= 1000
                    ? `$${(v / 1000).toFixed(0)}k`
                    : `$${v}`
                  : v
              }
            />
            {showTooltip && (
              <ChartTooltip content={<PremiumTooltipContent />} />
            )}
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={colors[0]}
                  stopOpacity={0.25}
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
              fill={`url(#grad-${dataKey})`}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} />
            )}
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12, fill: 'oklch(0.55 0.02 260)' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12, fill: 'oklch(0.55 0.02 260)' }}
              tickFormatter={(v) =>
                typeof v === 'number'
                  ? v >= 1000
                    ? `$${(v / 1000).toFixed(0)}k`
                    : `$${v}`
                  : v
              }
            />
            {showTooltip && (
              <ChartTooltip content={<PremiumTooltipContent />} />
            )}
            <Bar
              dataKey={dataKey}
              fill={colors[0]}
              radius={[6, 6, 0, 0]}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </BarChart>
        )

      case 'pie':
        return (
          <PieChart>
            {showTooltip && (
              <ChartTooltip content={<PremiumTooltipContent />} />
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
              animationDuration={800}
              animationEasing="ease-out"
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className={cn('border-border/50 shadow-none', className)}>
        {(title || description) && (
          <CardHeader className="pb-2">
            {title && (
              <CardTitle className="text-[15px] font-semibold tracking-tight">
                {title}
              </CardTitle>
            )}
            {description && (
              <p className="text-[13px] text-muted-foreground/70">
                {description}
              </p>
            )}
          </CardHeader>
        )}
        <CardContent>
          <ChartContainer config={chartConfig} className="mx-auto w-full">
            <div style={{ height }}>{renderChart()}</div>
          </ChartContainer>
          {showLegend && type === 'pie' && (
            <div className="mt-2">
              <ChartLegend
                content={
                  <ChartLegendContent
                    nameKey={xAxisKey}
                    className="[&>li]:gap-2 [&>li]:text-xs [&>li]:font-medium"
                  />
                }
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

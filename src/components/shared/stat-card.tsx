'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: LucideIcon
  title: string
  value: string
  change?: number
  changeLabel?: string
  iconBgColor?: string
  iconColor?: string
  className?: string
}

export function StatCard({
  icon: Icon,
  title,
  value,
  change,
  changeLabel,
  iconBgColor = 'bg-primary/10',
  iconColor = 'text-primary',
  className,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const isNeutral = change === undefined || change === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Card className={cn('transition-shadow hover:shadow-md', className)}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
            </div>
            <div
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-xl',
                iconBgColor,
              )}
            >
              <Icon className={cn('size-5', iconColor)} />
            </div>
          </div>

          {!isNeutral && change !== undefined && (
            <div className="mt-3 flex items-center gap-1.5">
              <span
                className={cn(
                  'flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold',
                  isPositive &&
                    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                  isNegative &&
                    'bg-red-500/10 text-red-600 dark:text-red-400',
                )}
              >
                {isPositive && <TrendingUp className="size-3" />}
                {isNegative && <TrendingDown className="size-3" />}
                {isNeutral && <Minus className="size-3" />}
                {Math.abs(change).toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

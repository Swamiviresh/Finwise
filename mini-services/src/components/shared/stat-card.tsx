'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react'
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
  index?: number
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
  index = 0,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const isNeutral = change === undefined || change === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
        delay: index * 0.08,
      }}
      whileHover={{ y: -2 }}
      className="transition-shadow duration-300"
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          '0 8px 30px -8px oklch(0.13 0.01 285 / 0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div
        className={cn(
          'rounded-2xl border-0 bg-muted/30 p-5 transition-colors duration-200',
          'hover:bg-muted/50',
          className,
        )}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-[13px] font-medium text-muted-foreground/70">
              {title}
            </p>
            <p className="text-3xl font-extrabold tracking-tighter leading-none">
              {value}
            </p>
          </div>
          <div
            className={cn(
              'flex size-12 shrink-0 items-center justify-center rounded-2xl',
              iconBgColor,
            )}
          >
            <Icon className={cn('size-5', iconColor)} />
          </div>
        </div>

        {!isNeutral && change !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 + 0.2 }}
            className="mt-3 flex items-center gap-2"
          >
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
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
              <span className="text-[12px] text-muted-foreground/60">
                {changeLabel}
              </span>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

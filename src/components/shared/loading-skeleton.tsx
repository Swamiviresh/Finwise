'use client'

import { cn } from '@/lib/utils'

export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Stat cards row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <ChartSkeleton />
        </div>
        <div className="lg:col-span-3">
          <ChartSkeleton />
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-2xl border border-border/40 bg-muted/20 p-5">
        <div className="mb-4 flex items-center justify-between">
          <ShimmerBlock className="h-5 w-40" />
          <ShimmerBlock className="h-8 w-24 rounded-xl" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <TransactionSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ShimmerBlock({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      style={style}
      className={cn(
        'relative overflow-hidden rounded-xl bg-muted/60',
        'after:absolute after:inset-0 after:translate-x-[-200%]',
        'after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent',
        'after:animate-shimmer',
        className,
      )}
    />
  )
}

export function TransactionSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <ShimmerBlock className="size-10 rounded-full shrink-0" />
      <div className="flex flex-1 flex-col gap-2">
        <ShimmerBlock className="h-4 w-40" />
        <ShimmerBlock className="h-3 w-24" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <ShimmerBlock className="h-4 w-20" />
        <ShimmerBlock className="h-3 w-16" />
      </div>
    </div>
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-muted/20 p-5', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2.5">
          <ShimmerBlock className="h-3.5 w-24" />
          <ShimmerBlock className="h-8 w-32" />
        </div>
        <ShimmerBlock className="size-12 rounded-2xl" />
      </div>
      <ShimmerBlock className="mt-4 h-4 w-20" />
    </div>
  )
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border/40 bg-muted/20 p-5', className)}>
      <div className="space-y-2">
        <ShimmerBlock className="h-5 w-36" />
        <ShimmerBlock className="h-3 w-24" />
      </div>
      <div className="mt-4 flex h-[280px] items-end gap-2">
        {Array.from({ length: 12 }).map((_, i) => {
          const height = 30 + Math.random() * 60
          return (
            <ShimmerBlock
              key={i}
              className="flex-1 rounded-t-lg"
              style={{ height: `${height}%` }}
            />
          )
        })}
      </div>
    </div>
  )
}

export function ListSkeleton({
  count = 5,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl p-3">
          <ShimmerBlock className="size-10 rounded-full shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <ShimmerBlock className="h-4 w-3/4" />
            <ShimmerBlock className="h-3 w-1/2" />
          </div>
          <ShimmerBlock className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

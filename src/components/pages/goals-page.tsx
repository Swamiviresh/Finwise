'use client'

import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format,
  parseISO,
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
  addDays,
  addMonths,
  addWeeks,
} from 'date-fns'
import {
  Plus,
  Pencil,
  Trash2,
  Target,
  PiggyBank,
  Trophy,
  CalendarDays,
  Loader2,
  CircleCheckBig,
  Sparkles,
  TrendingUp,
  Clock,
} from 'lucide-react'

import { useRouterStore } from '@/store/router-store'
import {
  useGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
} from '@/hooks/use-goals'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/format'
import { APP_CONFIG } from '@/lib/constants'
import type { Goal, GoalCreate, GoalUpdate, ApiResponse } from '@/types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
  CardDescription,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useMediaQuery } from '@reactuses/core'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOAL_EMOJIS = [
  '🎯', '🏠', '🚗', '✈️', '💍', '🎓', '💻', '📱', '🎮', '🏖️',
  '🏦', '💰', '📊', '🛡️', '🎁', '🎵', '🏋️', '🏥', '👶', '🐕',
  '🚀', '🌍', '📱', '🎨', '📚', '🧳', '🏔️', '⛵', '🎸', '🍕',
] as const

const GOAL_COLORS = [
  { label: 'Emerald', value: '#10b981' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Lime', value: '#84cc16' },
] as const

const QUICK_ADD_AMOUNTS = [10, 25, 50, 100, 250, 500, 1000] as const

// ---------------------------------------------------------------------------
// Form schemas
// ---------------------------------------------------------------------------

const goalFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  targetAmount: z.coerce.number().min(1, 'Target must be greater than 0'),
  currentAmount: z.coerce.number().min(0).default(0),
  deadline: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().default('🎯'),
  color: z.string().default('#10b981'),
})

type GoalFormValues = z.infer<typeof goalFormSchema>

const addFundsSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
})

type AddFundsValues = z.infer<typeof addFundsSchema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDeadlineCountdown(deadline: Date | string | null): string {
  if (!deadline) return ''
  const d = typeof deadline === 'string' ? parseISO(deadline) : deadline
  const now = new Date()
  const days = differenceInDays(d, now)

  if (days < 0) return `${Math.abs(days)} days overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return '1 day left'
  if (days <= 7) return `${days} days left`
  if (days <= 30) {
    const weeks = Math.floor(days / 7)
    const remDays = days % 7
    return remDays > 0
      ? `${weeks}w ${remDays}d left`
      : `${weeks} week${weeks > 1 ? 's' : ''} left`
  }
  const months = differenceInMonths(d, now)
  if (months > 0) {
    const remDays = differenceInDays(d, addMonths(now, months))
    return remDays > 0
      ? `${months}mo ${remDays}d left`
      : `${months} month${months > 1 ? 's' : ''} left`
  }
  return `${days} days left`
}

function estimateCompletionDate(
  currentAmount: number,
  targetAmount: number,
  createdAt: Date | string,
): string | null {
  if (currentAmount <= 0 || targetAmount <= 0) return null
  if (currentAmount >= targetAmount) return null

  const created = typeof createdAt === 'string' ? parseISO(createdAt) : createdAt
  const now = new Date()
  const daysElapsed = Math.max(differenceInDays(now, created), 1)
  const dailyRate = currentAmount / daysElapsed

  if (dailyRate <= 0) return null

  const remaining = targetAmount - currentAmount
  const daysNeeded = Math.ceil(remaining / dailyRate)
  return format(addDays(now, daysNeeded), 'MMM d, yyyy')
}

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

// ---------------------------------------------------------------------------
// Circular Progress
// ---------------------------------------------------------------------------

function CircularProgress({
  value,
  size = 80,
  strokeWidth = 6,
  color = '#10b981',
}: {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedValue = Math.min(Math.max(value, 0), 100)
  const offset = circumference - (clampedValue / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-label={`${Math.round(clampedValue)}% complete`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold">
          {Math.round(clampedValue)}%
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Color Swatch
// ---------------------------------------------------------------------------

function ColorSwatch({
  color,
  selected,
  onClick,
}: {
  color: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'h-7 w-7 rounded-full transition-all ' +
        (selected
          ? 'ring-2 ring-offset-2 ring-offset-background'
          : 'hover:scale-110')
      }
      style={{
        backgroundColor: color,
        ...(selected ? { ringColor: color } : {}),
      }}
      aria-label={`Select color ${color}`}
    />
  )
}

// ---------------------------------------------------------------------------
// Goal Form Content
// ---------------------------------------------------------------------------

interface GoalFormContentProps {
  form: ReturnType<typeof useForm<GoalFormValues>>
  isEditing: boolean
  isPending: boolean
  onClose: () => void
  onSubmit: (values: GoalFormValues) => void
}

function GoalFormContent({
  form,
  isEditing,
  isPending,
  onClose,
  onSubmit,
}: GoalFormContentProps) {
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Emergency Fund" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What are you saving for?"
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="targetAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isEditing && (
            <FormField
              control={form.control}
              name="currentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deadline (optional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarDays className="mr-2 size-4" />
                      {field.value
                        ? format(parseISO(field.value), 'MMM d, yyyy')
                        : 'Pick a date'}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      field.value ? parseISO(field.value) : undefined
                    }
                    onSelect={(date) =>
                      field.onChange(
                        date ? format(date, 'yyyy-MM-dd') : '',
                      )
                    }
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Icon Picker */}
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <div className="flex flex-wrap gap-2 rounded-lg border p-3">
                {GOAL_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => field.onChange(emoji)}
                    className={
                      'h-9 w-9 rounded-md text-lg flex items-center justify-center transition-all ' +
                      (field.value === emoji
                        ? 'bg-primary/10 ring-2 ring-primary'
                        : 'hover:bg-muted')
                    }
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Color Picker */}
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Accent Color</FormLabel>
              <div className="flex flex-wrap gap-2">
                {GOAL_COLORS.map((c) => (
                  <ColorSwatch
                    key={c.value}
                    color={c.value}
                    selected={field.value === c.value}
                    onClick={() => field.onChange(c.value)}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl h-10">
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="rounded-xl h-10">
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEditing ? 'Update Goal' : 'Create Goal'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

// ============================================================================
// Goals Page
// ============================================================================

export function GoalsPage() {
  const { user } = useRouterStore()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const currency = user?.currency || APP_CONFIG.DEFAULT_CURRENCY

  // ---- State ----
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Goal | null>(null)
  const [addFundsTarget, setAddFundsTarget] = React.useState<Goal | null>(null)

  // ---- Data ----
  const { data, isLoading, isError } = useGoals({
    limit: APP_CONFIG.MAX_PAGE_SIZE,
  })

  const goals = data?.data ?? []

  // ---- Mutations ----
  const createMutation = useCreateGoal()
  const updateMutation = useUpdateGoal()
  const deleteMutation = useDeleteGoal()

  // ---- Derived ----
  const activeGoals = React.useMemo(
    () => goals.filter((g) => !g.isCompleted),
    [goals],
  )
  const completedGoals = React.useMemo(
    () => goals.filter((g) => g.isCompleted),
    [goals],
  )

  const totalTarget = React.useMemo(
    () => goals.reduce((s, g) => s + g.targetAmount, 0),
    [goals],
  )
  const totalSaved = React.useMemo(
    () => goals.reduce((s, g) => s + g.currentAmount, 0),
    [goals],
  )
  const overallPercent =
    totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0

  // ---- Form ----
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      deadline: '',
      description: '',
      icon: '🎯',
      color: '#10b981',
    },
  })

  // ---- Add Funds Form ----
  const addFundsForm = useForm<AddFundsValues>({
    resolver: zodResolver(addFundsSchema),
    defaultValues: { amount: 0 },
  })

  const isEditing = !!editingGoal
  const isPending = createMutation.isPending || updateMutation.isPending
  const isAddingFunds = updateMutation.isPending && !!addFundsTarget

  // ---- Handlers ----
  const openCreate = React.useCallback(() => {
    console.log('[DEBUG] openCreate fired (Goals)')
    setEditingGoal(null)
    form.reset({
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      deadline: '',
      description: '',
      icon: '🎯',
      color: '#10b981',
    })
    setFormOpen(true)
  }, [form])

  const openEdit = React.useCallback(
    (goal: Goal) => {
      setEditingGoal(goal)
      form.reset({
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.deadline
          ? format(new Date(goal.deadline), 'yyyy-MM-dd')
          : '',
        description: goal.description || '',
        icon: goal.icon || '🎯',
        color: goal.color || '#10b981',
      })
      setFormOpen(true)
    },
    [form],
  )

  const openAddFunds = React.useCallback((goal: Goal) => {
    setAddFundsTarget(goal)
    addFundsForm.reset({ amount: 0 })
  }, [addFundsForm])

  const onSubmitGoal = React.useCallback(
    (values: GoalFormValues) => {
      const payload: GoalCreate = {
        name: values.name,
        targetAmount: values.targetAmount,
        deadline: values.deadline || undefined,
        description: values.description || undefined,
        icon: values.icon,
        color: values.color,
      }

      if (isEditing && editingGoal) {
        const updatePayload: GoalUpdate = {
          name: values.name,
          targetAmount: values.targetAmount,
          currentAmount: values.currentAmount,
          deadline: values.deadline || undefined,
          description: values.description || undefined,
          icon: values.icon,
          color: values.color,
        }
        updateMutation.mutate(
          { id: editingGoal.id, data: updatePayload },
          { onSuccess: () => setFormOpen(false) },
        )
      } else {
        createMutation.mutate(payload, {
          onSuccess: () => setFormOpen(false),
        })
      }
    },
    [isEditing, editingGoal, createMutation, updateMutation],
  )

  const onSubmitAddFunds = React.useCallback(
    (values: AddFundsValues) => {
      if (!addFundsTarget) return
      updateMutation.mutate(
        {
          id: addFundsTarget.id,
          data: {
            currentAmount: addFundsTarget.currentAmount + values.amount,
            isCompleted:
              addFundsTarget.currentAmount + values.amount >=
              addFundsTarget.targetAmount,
          },
        },
        { onSuccess: () => setAddFundsTarget(null) },
      )
    },
    [addFundsTarget, updateMutation],
  )

  const handleQuickAdd = React.useCallback(
    (amount: number) => {
      if (!addFundsTarget) return
      updateMutation.mutate(
        {
          id: addFundsTarget.id,
          data: {
            currentAmount: addFundsTarget.currentAmount + amount,
            isCompleted:
              addFundsTarget.currentAmount + amount >=
              addFundsTarget.targetAmount,
          },
        },
        { onSuccess: () => setAddFundsTarget(null) },
      )
    },
    [addFundsTarget, updateMutation],
  )

  const handleDelete = React.useCallback(() => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }, [deleteTarget, deleteMutation])

  // ---- Render ----
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Financial Goals" actions={<div className="h-10 w-40" />} />
        <div className="grid gap-4 sm:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (isError || goals.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Financial Goals"
          description="Set and track your savings goals"
          actions={
            <Button className="rounded-xl h-11" onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              Create Goal
            </Button>
          }
        />
        <EmptyState
          icon={Target}
          title="Start your first savings goal"
          description="Whether it's an emergency fund, a dream vacation, or a new car — set a goal and start tracking your progress toward financial freedom."
          actionLabel="Create Your First Goal"
          onAction={openCreate}
        />
      </div>
    )
  }

  const formContent = (
    <GoalFormContent
      form={form}
      isEditing={isEditing}
      isPending={isPending}
      onClose={() => setFormOpen(false)}
      onSubmit={onSubmitGoal}
    />
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Financial Goals"
        description="Set and track your savings goals"
        actions={
          <Button className="rounded-xl h-11" onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Create Goal
          </Button>
        }
      />

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid gap-4 sm:grid-cols-3"
      >
        <Card className="rounded-2xl border-border/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Saved
                </p>
                <p className="text-2xl font-bold tracking-tight">
                  {formatCurrency(totalSaved, currency)}
                </p>
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10">
                <PiggyBank className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Target
                </p>
                <p className="text-2xl font-bold tracking-tight">
                  {formatCurrency(totalTarget, currency)}
                </p>
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Target className="size-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">
                  Overall Progress
                </p>
                <p className="text-2xl font-bold tracking-tight">
                  {formatPercentage(overallPercent, 0)}
                </p>
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                <TrendingUp className="size-5 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="size-5 text-amber-500" />
            Active Goals
            <Badge variant="secondary" className="ml-1">
              {activeGoals.length}
            </Badge>
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {activeGoals.map((goal, i) => {
                const pct =
                  goal.targetAmount > 0
                    ? Math.min(
                        (goal.currentAmount / goal.targetAmount) * 100,
                        100,
                      )
                    : 0
                const remaining = Math.max(
                  goal.targetAmount - goal.currentAmount,
                  0,
                )
                const estDate = estimateCompletionDate(
                  goal.currentAmount,
                  goal.targetAmount,
                  goal.createdAt,
                )

                return (
                  <motion.div
                    key={goal.id}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    layout
                  >
                    <Card
                      className="group h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-xl" role="img">
                            {goal.icon || '🎯'}
                          </span>
                          <span className="truncate">{goal.name}</span>
                        </CardTitle>
                        <CardAction>
                          <Badge
                            variant="outline"
                            className={
                              'text-xs ' +
                              (pct >= 70
                                ? 'border-emerald-300 text-emerald-600 dark:text-emerald-400'
                                : '')
                            }
                          >
                            {formatPercentage(pct, 0)}
                          </Badge>
                        </CardAction>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {goal.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {goal.description}
                          </p>
                        )}

                        {/* Progress Circle + Amounts */}
                        <div className="flex items-center gap-4">
                          <CircularProgress
                            value={pct}
                            size={84}
                            strokeWidth={6}
                            color={goal.color || '#10b981'}
                          />
                          <div className="flex-1 space-y-1">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Saved
                              </p>
                              <p className="text-lg font-bold">
                                {formatCurrency(
                                  goal.currentAmount,
                                  currency,
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Target
                              </p>
                              <p className="text-sm font-medium text-muted-foreground">
                                {formatCurrency(
                                  goal.targetAmount,
                                  currency,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="h-2 w-full rounded-full overflow-hidden bg-muted">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: goal.color || '#10b981' }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{
                                duration: 0.8,
                                ease: 'easeOut',
                                delay: i * 0.06 + 0.2,
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(remaining, currency)} remaining
                          </p>
                        </div>

                        {/* Deadline & Estimated */}
                        <div className="space-y-1.5 text-xs text-muted-foreground">
                          {goal.deadline && (
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="size-3" />
                              <span>{getDeadlineCountdown(goal.deadline)}</span>
                            </div>
                          )}
                          {estDate && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="size-3" />
                              <span>Est. completion: {estDate}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <Separator />
                        <div className="flex items-center justify-between gap-2">
                          <Button
                            size="sm"
                            className="h-8 text-xs"
                            style={{
                              backgroundColor: goal.color || '#10b981',
                              color: '#fff',
                            }}
                            onClick={() => openAddFunds(goal)}
                          >
                            <Plus className="mr-1.5 size-3" />
                            Add Funds
                          </Button>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => openEdit(goal)}
                            >
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(goal)}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="size-5 text-amber-500" />
            Completed
            <Badge variant="secondary" className="ml-1">
              {completedGoals.length}
            </Badge>
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedGoals.map((goal, i) => (
              <motion.div
                key={goal.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                layout
              >
                <Card className="h-full rounded-2xl border-border/40 opacity-60 backdrop-blur-sm transition-all duration-300 hover:opacity-90 hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CircleCheckBig className="size-5 text-emerald-500" />
                      <span className="truncate">{goal.name}</span>
                    </CardTitle>
                    <CardAction>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => openEdit(goal)}
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(goal)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4">
                      <CircularProgress
                        value={100}
                        size={64}
                        strokeWidth={5}
                        color="#10b981"
                      />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          Goal Achieved!
                        </p>
                        <p className="text-lg font-bold">
                          {formatCurrency(goal.currentAmount, currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Target: {formatCurrency(goal.targetAmount, currency)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3" />
                      <span>Completed</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Create/Edit Form — Desktop Dialog */}
      {!isMobile && (
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Edit Goal' : 'Create Goal'}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? 'Update your savings goal details.'
                  : 'Set a new savings goal and start your journey.'}
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}

      {/* Create/Edit Form — Mobile Sheet */}
      {isMobile && (
        <Sheet open={formOpen} onOpenChange={setFormOpen}>
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>
                {isEditing ? 'Edit Goal' : 'Create Goal'}
              </SheetTitle>
              <SheetDescription>
                {isEditing
                  ? 'Update your savings goal details.'
                  : 'Set a new savings goal and start your journey.'}
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-4">{formContent}</div>
          </SheetContent>
        </Sheet>
      )}

      {/* Add Funds Dialog */}
      <Dialog
        open={!!addFundsTarget}
        onOpenChange={(open) => !open && setAddFundsTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">
                {addFundsTarget?.icon || '🎯'}
              </span>
              Add Funds to &ldquo;{addFundsTarget?.name}&rdquo;
            </DialogTitle>
            <DialogDescription>
              Current: {formatCurrency(addFundsTarget?.currentAmount || 0, currency)}
              {' / '}
              {formatCurrency(addFundsTarget?.targetAmount || 0, currency)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quick Add Buttons */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Quick add
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_ADD_AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl"
                    disabled={isAddingFunds}
                    onClick={() => handleQuickAdd(amt)}
                  >
                    +{formatCurrency(amt, currency)}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Custom Amount */}
            <Form {...addFundsForm}>
              <form
                onSubmit={addFundsForm.handleSubmit(onSubmitAddFunds)}
                className="space-y-4"
              >
                <FormField
                  control={addFundsForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="Enter amount"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddFundsTarget(null)}
                    className="rounded-xl h-10"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isAddingFunds} className="rounded-xl h-10">
                    {isAddingFunds && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Add Funds
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Goal"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? All progress will be lost.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

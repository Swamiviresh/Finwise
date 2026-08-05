'use client'

import * as React from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  TrendingDown,
  AlertTriangle,
  CalendarDays,
  Minus,
  Loader2,
  X,
  CircleDollarSign,
} from 'lucide-react'

import { useRouterStore } from '@/store/router-store'
import {
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from '@/hooks/use-budgets'
import { apiRequest } from '@/hooks/use-auth'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/format'
import {
  BUDGET_PERIODS,
  DEFAULT_CATEGORIES,
  APP_CONFIG,
} from '@/lib/constants'
import type {
  Budget,
  Category,
  CategoryBudget,
  BudgetCreate,
  ApiResponse,
} from '@/types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui/alert'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useMediaQuery } from '@reactuses/core'

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------

const categoryBudgetSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
})

const budgetFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  period: z.enum(['weekly', 'monthly', 'yearly']).default('monthly'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  alertThreshold: z.coerce.number().min(1).max(100).default(80),
  categoryBudgets: z.array(categoryBudgetSchema).optional(),
})

type BudgetFormValues = z.infer<typeof budgetFormSchema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getProgressColor(percent: number): string {
  if (percent >= 90) return 'bg-red-500'
  if (percent >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function getProgressBgColor(percent: number): string {
  if (percent >= 90) return 'bg-red-500/20'
  if (percent >= 70) return 'bg-amber-500/20'
  return 'bg-emerald-500/20'
}

function getProgressTextColor(percent: number): string {
  if (percent >= 90) return 'text-red-600 dark:text-red-400'
  if (percent >= 70) return 'text-amber-600 dark:text-amber-400'
  return 'text-emerald-600 dark:text-emerald-400'
}

function getAlertType(percent: number, threshold: number): 'danger' | 'warning' | null {
  if (percent >= 100) return 'danger'
  if (percent >= threshold) return 'warning'
  return null
}

const periodLabels: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' },
  }),
}

// ============================================================================
// Budget Form Content (shared between Dialog & Sheet)
// ============================================================================

interface BudgetFormContentProps {
  form: ReturnType<typeof useForm<BudgetFormValues>>
  categories: Category[]
  isEditing: boolean
  isPending: boolean
  onClose: () => void
  onSubmit: (values: BudgetFormValues) => void
}

function BudgetFormContent({
  form,
  categories,
  isEditing,
  isPending,
  onClose,
  onSubmit,
}: BudgetFormContentProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'categoryBudgets',
  })

  const expenseCategories = React.useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories],
  )

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
              <FormLabel>Budget Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Monthly Groceries" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Budget</FormLabel>
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

          <FormField
            control={form.control}
            name="period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Period</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BUDGET_PERIODS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
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
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date (optional)</FormLabel>
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
                          : 'No end date'}
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
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Leave empty for ongoing budget
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="alertThreshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alert Threshold (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="80"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Get alerted when spending reaches this % of budget
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Category Budgets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold">Category Budgets</h4>
              <p className="text-xs text-muted-foreground">
                Allocate specific amounts to expense categories
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ categoryId: '', amount: 0 })
              }
            >
              <Plus className="mr-1 size-3.5" />
              Add
            </Button>
          </div>

          {fields.length === 0 && (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              No category budgets added. The total budget will apply without
              category breakdown.
            </p>
          )}

          <div className="space-y-3 max-h-48 overflow-y-auto">
            {fields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-end gap-2"
              >
                <FormField
                  control={form.control}
                  name={`categoryBudgets.${index}.categoryId`}
                  render={({ field: catField }) => (
                    <FormItem className="flex-1">
                      <Select
                        value={catField.value}
                        onValueChange={catField.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {expenseCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <span className="flex items-center gap-2">
                                {cat.icon && <span>{cat.icon}</span>}
                                {cat.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`categoryBudgets.${index}.amount`}
                  render={({ field: amtField }) => (
                    <FormItem className="w-32">
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...amtField}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(index)}
                >
                  <X className="size-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEditing ? 'Update Budget' : 'Create Budget'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

// ============================================================================
// Budgets Page
// ============================================================================

export function BudgetsPage() {
  const { user } = useRouterStore()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const queryClient = useQueryClient()
  const currency = user?.currency || APP_CONFIG.DEFAULT_CURRENCY

  // ---- Dialog / Sheet state ----
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingBudget, setEditingBudget] = React.useState<Budget | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Budget | null>(null)

  // ---- Data ----
  const { data, isLoading, isError } = useBudgets({
    limit: APP_CONFIG.MAX_PAGE_SIZE,
  })

  const categoriesQuery = useQuery<ApiResponse<Category>>({
    queryKey: ['categories'],
    queryFn: () => apiRequest('/api/categories'),
    staleTime: 5 * 60 * 1000,
  })
  const categories = React.useMemo(() => {
    if (categoriesQuery.data?.data) {
      return categoriesQuery.data.data as unknown as Category[]
    }
    return DEFAULT_CATEGORIES.map((c) => ({
      id: c.name.toLowerCase().replace(/\s+/g, '-'),
      name: c.name,
      icon: c.icon,
      color: c.color,
      type: c.type,
      isDefault: true,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as Category[]
  }, [categoriesQuery.data])

  const budgets = data?.data ?? []

  // ---- Mutations ----
  const createMutation = useCreateBudget()
  const updateMutation = useUpdateBudget()
  const deleteMutation = useDeleteBudget()

  // ---- Derived ----
  const totalBudget = React.useMemo(
    () => budgets.reduce((sum, b) => sum + b.amount, 0),
    [budgets],
  )
  const totalSpent = React.useMemo(
    () => budgets.reduce((sum, b) => sum + b.spent, 0),
    [budgets],
  )
  const overallPercent =
    totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0

  // ---- Budget alerts ----
  const budgetAlerts = React.useMemo(() => {
    return budgets.filter(
      (b) => b.spent > 0 && (b.spent / b.amount) * 100 >= b.alertThreshold,
    )
  }, [budgets])

  // ---- Form ----
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      name: '',
      amount: 0,
      period: 'monthly',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
      alertThreshold: 80,
      categoryBudgets: [],
    },
  })

  const isEditing = !!editingBudget
  const isPending = createMutation.isPending || updateMutation.isPending

  // ---- Handlers ----
  const openCreate = React.useCallback(() => {
    setEditingBudget(null)
    form.reset({
      name: '',
      amount: 0,
      period: 'monthly',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
      alertThreshold: 80,
      categoryBudgets: [],
    })
    setFormOpen(true)
  }, [form])

  const openEdit = React.useCallback(
    (budget: Budget) => {
      setEditingBudget(budget)
      form.reset({
        name: budget.name,
        amount: budget.amount,
        period: budget.period,
        startDate: format(new Date(budget.startDate), 'yyyy-MM-dd'),
        endDate: budget.endDate
          ? format(new Date(budget.endDate), 'yyyy-MM-dd')
          : '',
        alertThreshold: budget.alertThreshold,
        categoryBudgets: budget.categoryBudgets?.length
          ? budget.categoryBudgets.map((cb) => ({
              categoryId: cb.categoryId,
              amount: cb.amount,
            }))
          : [],
      })
      setFormOpen(true)
    },
    [form],
  )

  const onSubmit = React.useCallback(
    (values: BudgetFormValues) => {
      const payload: BudgetCreate = {
        name: values.name,
        amount: values.amount,
        period: values.period,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        alertThreshold: values.alertThreshold,
        categoryBudgets: values.categoryBudgets?.length
          ? values.categoryBudgets.filter((cb) => cb.categoryId)
          : undefined,
      }
      if (isEditing && editingBudget) {
        updateMutation.mutate(
          { id: editingBudget.id, data: payload },
          { onSuccess: () => setFormOpen(false) },
        )
      } else {
        createMutation.mutate(payload, {
          onSuccess: () => setFormOpen(false),
        })
      }
    },
    [isEditing, editingBudget, createMutation, updateMutation],
  )

  const handleDelete = React.useCallback(() => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }, [deleteTarget, deleteMutation])

  const buildCategoryMap = React.useCallback(() => {
    const map = new Map<string, Category>()
    for (const c of categories) {
      map.set(c.id, c)
    }
    return map
  }, [categories])

  const categoryMap = buildCategoryMap()

  // ---- Render ----
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Budgets" actions={<div className="h-10 w-36" />} />
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

  if (isError || budgets.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Budgets"
          description="Track and manage your spending limits"
          actions={
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              Create Budget
            </Button>
          }
        />
        <EmptyState
          icon={Wallet}
          title="No budgets yet"
          description="Create your first budget to start tracking spending limits and staying on top of your finances."
          actionLabel="Create Budget"
          onAction={openCreate}
        />
      </div>
    )
  }

  const formContent = (
    <BudgetFormContent
      form={form}
      categories={categories}
      isEditing={isEditing}
      isPending={isPending}
      onClose={() => setFormOpen(false)}
      onSubmit={onSubmit}
    />
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Budgets"
        description="Track and manage your spending limits"
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Create Budget
          </Button>
        }
      />

      {/* Budget Alerts */}
      <AnimatePresence>
        {budgetAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {budgetAlerts.map((budget) => {
              const pct = (budget.spent / budget.amount) * 100
              const alertType = getAlertType(pct, budget.alertThreshold)
              return (
                <Alert
                  key={budget.id}
                  variant={alertType === 'danger' ? 'destructive' : 'default'}
                  className={
                    alertType === 'warning'
                      ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
                      : ''
                  }
                >
                  <AlertTriangle className={alertType === 'warning' ? 'text-amber-600 dark:text-amber-400' : ''} />
                  <AlertTitle
                    className={
                      alertType === 'warning'
                        ? 'text-amber-800 dark:text-amber-300'
                        : ''
                    }
                  >
                    {pct >= 100
                      ? `${budget.name} budget exceeded!`
                      : `${budget.name} approaching limit`}
                  </AlertTitle>
                  <AlertDescription
                    className={
                      alertType === 'warning'
                        ? 'text-amber-700 dark:text-amber-400'
                        : ''
                    }
                  >
                    You have spent {formatCurrency(budget.spent, currency)} of{' '}
                    {formatCurrency(budget.amount, currency)} ({formatPercentage(pct)}).
                    {pct >= 100
                      ? ` Over by ${formatCurrency(budget.spent - budget.amount, currency)}.`
                      : ` Only ${formatCurrency(budget.amount - budget.spent, currency)} remaining.`}
                  </AlertDescription>
                </Alert>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monthly Overview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleDollarSign className="size-5 text-primary" />
              Overall Budget Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalSpent, currency)}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalBudget, currency)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span
                  className={getProgressTextColor(overallPercent)}
                >
                  {formatPercentage(overallPercent)} used
                </span>
                <span className="text-muted-foreground">
                  {formatCurrency(Math.max(totalBudget - totalSpent, 0), currency)}{' '}
                  remaining
                </span>
              </div>
              <div className={`h-3 w-full rounded-full ${getProgressBgColor(overallPercent)}`}>
                <motion.div
                  className={`h-full rounded-full ${getProgressColor(overallPercent)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(overallPercent, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Budget Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {budgets.map((budget, i) => {
            const pct =
              budget.amount > 0
                ? Math.min((budget.spent / budget.amount) * 100, 100)
                : 0
            const remaining = Math.max(budget.amount - budget.spent, 0)
            const hasCategoryBudgets =
              budget.categoryBudgets && budget.categoryBudgets.length > 0

            return (
              <motion.div
                key={budget.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                layout
              >
                <Card className="group h-full transition-all hover:shadow-lg hover:-translate-y-0.5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="size-4 text-muted-foreground" />
                      <span className="truncate">{budget.name}</span>
                    </CardTitle>
                    <CardAction>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant="outline"
                          className="capitalize text-xs"
                        >
                          {periodLabels[budget.period] || budget.period}
                        </Badge>
                      </div>
                    </CardAction>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Spent / Total */}
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Spent</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(budget.spent, currency)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">of</p>
                        <p className="text-sm font-medium text-muted-foreground">
                          {formatCurrency(budget.amount, currency)}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={getProgressTextColor(pct)}
                        >
                          {formatPercentage(pct)} used
                        </span>
                        <span className="text-muted-foreground">
                          {formatCurrency(remaining, currency)} left
                        </span>
                      </div>
                      <div className={`h-2 w-full rounded-full ${getProgressBgColor(pct)}`}>
                        <motion.div
                          className={`h-full rounded-full ${getProgressColor(pct)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{
                            duration: 0.6,
                            ease: 'easeOut',
                            delay: i * 0.06 + 0.2,
                          }}
                        />
                      </div>
                    </div>

                    {/* Category Breakdown */}
                    {hasCategoryBudgets && (
                      <div className="space-y-2">
                        <Separator />
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Category Breakdown
                        </p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {budget.categoryBudgets!.map((cb) => {
                            const cat = categoryMap.get(cb.categoryId)
                            const cbPct =
                              cb.amount > 0
                                ? Math.min(
                                    (cb.spent / cb.amount) * 100,
                                    100,
                                  )
                                : 0
                            return (
                              <div
                                key={cb.id}
                                className="flex items-center gap-2 text-xs"
                              >
                                <span className="shrink-0">
                                  {cat?.icon || '📌'}
                                </span>
                                <span className="flex-1 truncate">
                                  {cat?.name || 'Unknown'}
                                </span>
                                <span className="text-muted-foreground shrink-0">
                                  {formatCurrency(cb.spent, currency)}/
                                  {formatCurrency(cb.amount, currency)}
                                </span>
                                <span
                                  className={`w-6 text-right ${getProgressTextColor(cbPct)}`}
                                >
                                  {Math.round(cbPct)}%
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3" />
                      <span>
                        {formatDate(budget.startDate)}
                        {budget.endDate
                          ? ` — ${formatDate(budget.endDate)}`
                          : ' — Ongoing'}
                      </span>
                    </div>

                    {/* Actions */}
                    <Separator />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => openEdit(budget)}
                      >
                        <Pencil className="mr-1.5 size-3" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(budget)}
                      >
                        <Trash2 className="mr-1.5 size-3" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Create/Edit Form — Desktop Dialog */}
      {!isMobile && (
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Edit Budget' : 'Create Budget'}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? 'Update your budget settings and limits.'
                  : 'Set up a new budget to control your spending.'}
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
                {isEditing ? 'Edit Budget' : 'Create Budget'}
              </SheetTitle>
              <SheetDescription>
                {isEditing
                  ? 'Update your budget settings and limits.'
                  : 'Set up a new budget to control your spending.'}
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-4">
              {formContent}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Budget"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

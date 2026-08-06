'use client'

import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import {
  Plus,
  Search,
  Download,
  FileJson,
  FileSpreadsheet,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FilterX,
  CalendarIcon,
  Loader2,
} from 'lucide-react'

import { useRouterStore } from '@/store/router-store'
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@/hooks/use-transactions'
import { apiRequest } from '@/hooks/use-auth'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { TransactionSkeleton, ListSkeleton } from '@/components/shared/loading-skeleton'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { formatCurrency, formatDate } from '@/lib/format'
import { PAYMENT_METHODS, DEFAULT_CATEGORIES, APP_CONFIG } from '@/lib/constants'
import { transactionSchema } from '@/lib/validators'
import type {
  TransactionWithCategory,
  TransactionFilters,
  Category,
  ApiResponse,
} from '@/types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useMediaQuery } from '@reactuses/core'

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------

const formSchema = transactionSchema

type TransactionFormValues = z.infer<typeof formSchema>

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'description', label: 'Description' },
] as const

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

const typeBadgeClass: Record<string, string> = {
  income: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  expense: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800',
  transfer: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
}

// ---------------------------------------------------------------------------
// Row animation
// ---------------------------------------------------------------------------

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

// ============================================================================
// Transactions Page
// ============================================================================

export function TransactionsPage() {
  const { user } = useRouterStore()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const currency = user?.currency || APP_CONFIG.DEFAULT_CURRENCY

  // ---- Filters state ----
  const [filters, setFilters] = React.useState<TransactionFilters>({
    page: 1,
    limit: 10,
    sortBy: 'date',
    sortOrder: 'desc',
  })
  const [searchInput, setSearchInput] = React.useState('')
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null)

  const updateFilter = React.useCallback(
    (patch: Partial<TransactionFilters>) => {
      setFilters((prev) => ({
        ...prev,
        ...patch,
        // Reset to page 1 when any filter changes (except page itself)
        page: patch.page !== undefined ? patch.page : 1,
      }))
    },
    [],
  )

  const clearFilters = React.useCallback(() => {
    setFilters({
      page: 1,
      limit: filters.limit,
      sortBy: 'date',
      sortOrder: 'desc',
    })
    setSearchInput('')
    setStartDate(undefined)
    setEndDate(undefined)
  }, [filters.limit])

  const hasActiveFilters = React.useMemo(
    () =>
      !!filters.search ||
      !!filters.type ||
      !!filters.categoryId ||
      !!filters.startDate ||
      !!filters.endDate ||
      filters.sortBy !== 'date' ||
      filters.sortOrder !== 'desc',
    [filters],
  )

  // ---- Debounced search ----
  const handleSearchChange = React.useCallback(
    (value: string) => {
      setSearchInput(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        updateFilter({ search: value || undefined })
      }, 300)
    },
    [updateFilter],
  )

  // ---- Date state ----
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined)
  const [startOpen, setStartOpen] = React.useState(false)
  const [endOpen, setEndOpen] = React.useState(false)

  React.useEffect(() => {
    updateFilter({
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
    })
    }, [startDate, endDate])

  // ---- Dialog / Sheet state ----
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingTransaction, setEditingTransaction] =
    React.useState<TransactionWithCategory | null>(null)
  const [deleteTarget, setDeleteTarget] =
    React.useState<TransactionWithCategory | null>(null)

  // ---- Data ----
  const { data, isLoading, isError } = useTransactions(filters)

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

  const transactions = data?.data ?? []
  const pagination = data?.pagination
  const totalItems = pagination?.total ?? 0
  const totalPages = pagination?.totalPages ?? 0
  const currentPage = filters.page ?? 1
  const currentLimit = filters.limit ?? 10

  const startIdx = (currentPage - 1) * currentLimit + 1
  const endIdx = Math.min(currentPage * currentLimit, totalItems)

  // ---- Mutations ----
  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()
  const deleteMutation = useDeleteTransaction()

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending

  // ---- Form ----
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined as unknown as number,
      description: '',
      type: 'expense',
      date: format(new Date(), 'yyyy-MM-dd'),
      categoryId: '',
      paymentMethod: '',
      notes: '',
    },
  })

  const watchedType = form.watch('type')

  const filteredCategories = React.useMemo(() => {
    if (!watchedType) return categories
    return categories.filter(
      (c) => c.type === watchedType || c.type === 'transfer',
    )
  }, [categories, watchedType])

  const openCreateForm = React.useCallback(() => {
    setEditingTransaction(null)
    form.reset({
      amount: undefined as unknown as number,
      description: '',
      type: 'expense',
      date: format(new Date(), 'yyyy-MM-dd'),
      categoryId: '',
      paymentMethod: '',
      notes: '',
    })
    setFormOpen(true)
  }, [form])

  const openEditForm = React.useCallback(
    (t: TransactionWithCategory) => {
      setEditingTransaction(t)
      form.reset({
        amount: t.amount,
        description: t.description,
        type: t.type,
        date: format(new Date(t.date), 'yyyy-MM-dd'),
        categoryId: t.categoryId,
        paymentMethod: t.paymentMethod || '',
        notes: t.notes || '',
      })
      setFormOpen(true)
    },
    [form],
  )

  const onSubmit = React.useCallback(
    (values: TransactionFormValues) => {
      if (editingTransaction) {
        updateMutation.mutate(
          { id: editingTransaction.id, data: values },
          { onSuccess: () => setFormOpen(false) },
        )
      } else {
        createMutation.mutate(values, {
          onSuccess: () => setFormOpen(false),
        })
      }
    },
    [editingTransaction, createMutation, updateMutation],
  )

  const handleDelete = React.useCallback(() => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }, [deleteTarget, deleteMutation])

  // ---- Export ----
  const exportTransactions = React.useCallback(
    (format: 'csv' | 'json') => {
      if (transactions.length === 0) return

      let content: string
      let mimeType: string
      let ext: string

      if (format === 'json') {
        const exportData = transactions.map((t) => ({
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category?.name || '',
          paymentMethod: t.paymentMethod || '',
          date: t.date,
          notes: t.notes || '',
        }))
        content = JSON.stringify(exportData, null, 2)
        mimeType = 'application/json'
        ext = 'json'
      } else {
        const headers = [
          'Description',
          'Amount',
          'Type',
          'Category',
          'Payment Method',
          'Date',
          'Notes',
        ]
        const rows = transactions.map((t) => [
          `"${t.description.replace(/"/g, '\"')}"`,
          t.amount.toFixed(2),
          t.type,
          t.category?.name || '',
          t.paymentMethod || '',
          format(new Date(t.date), 'yyyy-MM-dd'),
          `"${(t.notes || '').replace(/"/g, '\"')}"`,
        ])
        content = [headers.join(','), ...rows.map((r) => r.join(','))].join(
          '\n',
        )
        mimeType = 'text/csv'
        ext = 'csv'
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    },
    [transactions],
  )

  // ---- Sort toggle ----
  const toggleSortOrder = React.useCallback(() => {
    updateFilter({
      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
    })
  }, [filters.sortOrder, updateFilter])

  const SortIcon =
    filters.sortOrder === 'asc' ? ArrowUp : ArrowDown

  // ---- Page numbers ----
  const pageNumbers = React.useMemo(() => {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }, [totalPages, currentPage])

  // ---- Get payment method label ----
  const getPaymentLabel = React.useCallback(
    (val: string | null) => {
      if (!val) return '—'
      return PAYMENT_METHODS.find((m) => m.value === val)?.label || val
    },
    [],
  )

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Transactions"
        description="Track and manage all your financial transactions"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Transactions' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl h-10" disabled={transactions.length === 0}>
                  <Download className="size-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportTransactions('csv')}>
                  <FileSpreadsheet className="size-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => exportTransactions('json')}>
                  <FileJson className="size-4" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" className="rounded-xl h-10" onClick={openCreateForm}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">Add Transaction</span>
            </Button>
          </div>
        }
      />

      {/* Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-5 shadow-sm"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-2">
          {/* Search */}
          <div className="relative flex-1 lg:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Type Filter */}
          <Select
            value={filters.type || 'all'}
            onValueChange={(val) =>
              updateFilter({ type: val === 'all' ? undefined : (val as TransactionFilters['type']) })
            }
          >
            <SelectTrigger className="w-full lg:w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select
            value={filters.categoryId || 'all'}
            onValueChange={(val) =>
              updateFilter({ categoryId: val === 'all' ? undefined : val })
            }
          >
            <SelectTrigger className="w-full lg:w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="flex items-center gap-1.5">
                    {cat.icon && <span className="text-sm">{cat.icon}</span>}
                    {cat.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Start Date */}
          <Popover open={startOpen} onOpenChange={setStartOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal lg:w-[160px]"
              >
                <CalendarIcon className="mr-2 size-4" />
                {startDate ? format(startDate, 'MMM d, yyyy') : 'From'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(d) => {
                  setStartDate(d)
                  setStartOpen(false)
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* End Date */}
          <Popover open={endOpen} onOpenChange={setEndOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal lg:w-[160px]"
              >
                <CalendarIcon className="mr-2 size-4" />
                {endDate ? format(endDate, 'MMM d, yyyy') : 'To'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(d) => {
                  setEndDate(d)
                  setEndOpen(false)
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Sort By */}
          <Select
            value={filters.sortBy || 'date'}
            onValueChange={(val) => updateFilter({ sortBy: val })}
          >
            <SelectTrigger className="w-full lg:w-[130px]">
              <ArrowUpDown className="mr-1 size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Order Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortOrder}
            title={
              filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'
            }
          >
            <SortIcon className="size-4" />
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              <FilterX className="size-4" />
              <span className="hidden lg:inline">Clear</span>
            </Button>
          )}
        </div>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <Card className="rounded-2xl border-border/40">
          <CardContent className="p-6">
            <div className="hidden md:block">
              {Array.from({ length: 8 }).map((_, i) => (
                <TransactionSkeleton key={i} />
              ))}
            </div>
            <div className="md:hidden">
              <ListSkeleton count={5} />
            </div>
          </CardContent>
        </Card>
      ) : isError ? (
        <Card className="rounded-2xl border-border/40">
          <CardContent className="flex min-h-[300px] items-center justify-center p-8">
            <p className="text-sm text-muted-foreground">
              Failed to load transactions. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={hasActiveFilters ? Search : Plus}
          title={
            hasActiveFilters
              ? 'No matching transactions'
              : 'No transactions yet'
          }
          description={
            hasActiveFilters
              ? 'Try adjusting your filters to find what you are looking for.'
              : 'Start tracking your finances by adding your first transaction.'
          }
          actionLabel={hasActiveFilters ? 'Clear Filters' : 'Add Transaction'}
          onAction={hasActiveFilters ? clearFilters : openCreateForm}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="hidden md:block"
          >
            <Card className="rounded-2xl border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="pl-5 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Description</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Category</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Type</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Payment</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Date</TableHead>
                    <TableHead className="pr-5 text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {transactions.map((t, i) => (
                      <motion.tr
                        key={t.id}
                        custom={i}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={
                          'group border-b border-border/30 transition-all duration-200 hover:bg-muted/30' +
                          (i % 2 === 1 ? ' bg-muted/20' : '')
                        }
                      >
                        <TableCell className="max-w-[200px] truncate pl-5 font-medium">
                          {t.description}
                        </TableCell>
                        <TableCell>
                          <span
                            className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: `${t.category?.color}15`,
                              borderColor: `${t.category?.color}30`,
                              color: t.category?.color,
                            }}
                          >
                            {t.category?.icon && (
                              <span>{t.category.icon}</span>
                            )}
                            {t.category?.name || 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={typeBadgeClass[t.type] || ''}
                          >
                            {t.type.charAt(0).toUpperCase() +
                              t.type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {getPaymentLabel(t.paymentMethod)}
                        </TableCell>
                        <TableCell
                          className={
                            'text-right font-semibold font-mono tabular-nums ' +
                            (t.type === 'income'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : t.type === 'expense'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-amber-600 dark:text-amber-400')
                          }
                        >
                          {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}
                          {formatCurrency(t.amount, currency)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(t.date)}
                        </TableCell>
                        <TableCell className="pr-5">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => openEditForm(t)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(t)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </Card>
          </motion.div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            <AnimatePresence mode="popLayout">
              {transactions.map((t, i) => (
                <motion.div
                  key={t.id}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Card className="rounded-xl overflow-hidden border-border/40 hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium">
                              {t.description}
                            </p>
                            <Badge
                              variant="outline"
                              className={`shrink-0 ${typeBadgeClass[t.type] || ''}`}
                            >
                              {t.type.charAt(0).toUpperCase() +
                                t.type.slice(1)}
                            </Badge>
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span
                              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: `${t.category?.color}15`,
                                color: t.category?.color,
                              }}
                            >
                              {t.category?.icon && (
                                <span className="text-xs">
                                  {t.category.icon}
                                </span>
                              )}
                              {t.category?.name || 'Unknown'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {getPaymentLabel(t.paymentMethod)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={
                              'font-semibold tabular-nums ' +
                              (t.type === 'income'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : t.type === 'expense'
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-amber-600 dark:text-amber-400')
                            }
                          >
                            {t.type === 'income'
                              ? '+'
                              : t.type === 'expense'
                                ? '-'
                                : ''}
                            {formatCurrency(t.amount, currency)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatDate(t.date)}
                          </p>
                        </div>
                      </div>
                      {t.notes && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
                          {t.notes}
                        </p>
                      )}
                      <Separator className="my-3" />
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditForm(t)}
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(t)}
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalItems > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Showing{' '}
                  <span className="font-medium text-foreground">
                    {startIdx}
                  </span>
                  –
                  <span className="font-medium text-foreground">
                    {endIdx}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium text-foreground">
                    {totalItems}
                  </span>
                </span>
                <Select
                  value={String(currentLimit)}
                  onValueChange={(val) => updateFilter({ limit: Number(val) })}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-lg"
                  disabled={currentPage <= 1}
                  onClick={() => updateFilter({ page: 1 })}
                >
                  <ChevronsLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-lg"
                  disabled={currentPage <= 1}
                  onClick={() =>
                    updateFilter({ page: currentPage - 1 })
                  }
                >
                  <ChevronLeft className="size-4" />
                </Button>

                {pageNumbers.map((page, idx) =>
                  page === '...' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1 text-muted-foreground"
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="icon"
                      className="size-8 rounded-lg"
                      onClick={() => updateFilter({ page })}
                    >
                      {page}
                    </Button>
                  ),
                )}

                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-lg"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    updateFilter({ page: currentPage + 1 })
                  }
                >
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-lg"
                  disabled={currentPage >= totalPages}
                  onClick={() => updateFilter({ page: totalPages })}
                >
                  <ChevronsRight className="size-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* ========== Add / Edit Transaction Dialog (Desktop) ========== */}
      {!isMobile && (
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto rounded-2xl border-border/40">
            <DialogHeader>
              <DialogTitle>
                {editingTransaction
                  ? 'Edit Transaction'
                  : 'New Transaction'}
              </DialogTitle>
              <DialogDescription>
                {editingTransaction
                  ? 'Update the details of this transaction.'
                  : 'Add a new transaction to track your finances.'}
              </DialogDescription>
            </DialogHeader>
            <TransactionForm
              form={form}
              categories={filteredCategories}
              watchedType={watchedType}
              isSubmitting={isSubmitting}
              onSubmit={onSubmit}
              onTypeChange={(val) => form.setValue('categoryId', '')}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={isSubmitting}
                className="rounded-xl h-10"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="rounded-xl h-10"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {editingTransaction ? 'Save Changes' : 'Create Transaction'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ========== Add / Edit Transaction Sheet (Mobile) ========== */}
      {isMobile && (
        <Sheet open={formOpen} onOpenChange={setFormOpen}>
          <SheetContent side="bottom" className="max-h-[90vh] rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>
                {editingTransaction
                  ? 'Edit Transaction'
                  : 'New Transaction'}
              </SheetTitle>
              <SheetDescription>
                {editingTransaction
                  ? 'Update the details of this transaction.'
                  : 'Add a new transaction to track your finances.'}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4">
              <TransactionForm
                form={form}
                categories={filteredCategories}
                watchedType={watchedType}
                isSubmitting={isSubmitting}
                onSubmit={onSubmit}
                onTypeChange={(val) => form.setValue('categoryId', '')}
              />
            </div>
            <SheetFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={isSubmitting}
                className="flex-1 rounded-xl h-10"
              >
                Cancel
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="flex-1 rounded-xl h-10"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {editingTransaction ? 'Save Changes' : 'Create'}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}

      {/* ========== Delete Confirmation ========== */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Transaction"
        description={`Are you sure you want to delete "${deleteTarget?.description || ''}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

// ============================================================================
// Transaction Form (shared between Dialog and Sheet)
// ============================================================================

function TransactionForm({
  form,
  categories,
  watchedType,
  isSubmitting,
  onSubmit,
  onTypeChange,
}: {
  form: ReturnType<typeof useForm<TransactionFormValues>>
  categories: Category[]
  watchedType: string
  isSubmitting: boolean
  onSubmit: (values: TransactionFormValues) => void
  onTypeChange: (type: 'income' | 'expense' | 'transfer') => void
}) {
  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit(onSubmit)(e)
        }}
        className="space-y-4"
      >
        {/* Type Toggle */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <div className="flex gap-2 rounded-xl border p-1">
                  {(['income', 'expense'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        field.onChange(type)
                        onTypeChange(type)
                      }}
                      className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                        field.value === type
                          ? type === 'income'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {type === 'income' ? '↑ Income' : '↓ Expense'}
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Grocery shopping"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    disabled={isSubmitting}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const val = e.target.value
                      field.onChange(val === '' ? undefined : parseFloat(val))
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      disabled={isSubmitting}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {field.value
                        ? format(parseISO(field.value), 'MMM d, yyyy')
                        : 'Pick a date'}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? parseISO(field.value) : undefined}
                    onSelect={(date) =>
                      field.onChange(
                        date ? format(date, 'yyyy-MM-dd') : '',
                      )
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.length === 0 && (
                    <SelectItem value="_none" disabled>
                      No categories available
                    </SelectItem>
                  )}
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-1.5">
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

        {/* Payment Method */}
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select
                value={field.value || '_none'}
                onValueChange={(val) =>
                  field.onChange(val === '_none' ? '' : val)
                }
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      <span className="flex items-center gap-1.5">
                        <span>{method.icon}</span>
                        {method.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Notes{' '}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes..."
                  rows={3}
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

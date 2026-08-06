'use client'

import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format,
  parseISO,
  differenceInDays,
  addDays,
  isWithinInterval,
  startOfDay,
  isAfter,
  isBefore,
} from 'date-fns'
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CreditCard,
  Repeat,
  CalendarClock,
  ChevronDown,
  ExternalLink,
  Clock,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react'
import { useMediaQuery } from '@reactuses/core'

import { useRouterStore } from '@/store/router-store'
import {
  useSubscriptions,
  useCreateSubscription,
  useUpdateSubscription,
  useDeleteSubscription,
} from '@/hooks/use-subscriptions'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { CardSkeleton, ListSkeleton } from '@/components/shared/loading-skeleton'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { StatCard } from '@/components/shared/stat-card'
import { formatCurrency, formatDate } from '@/lib/format'
import { APP_CONFIG, SUBSCRIPTION_BILLING_CYCLES } from '@/lib/constants'
import type { Subscription, SubscriptionCreate, PaginationParams } from '@/types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

// ============================================================================
// Subscription Presets
// ============================================================================

interface SubscriptionPreset {
  name: string
  icon: string
  color: string
  category: string
  typicalAmount: number
  billingCycle: 'monthly' | 'yearly' | 'weekly'
}

export const SUBSCRIPTION_PRESETS: SubscriptionPreset[] = [
  { name: 'Netflix', icon: 'N', color: '#E50914', category: 'Entertainment', typicalAmount: 15.99, billingCycle: 'monthly' },
  { name: 'Spotify', icon: 'S', color: '#1DB954', category: 'Entertainment', typicalAmount: 10.99, billingCycle: 'monthly' },
  { name: 'Amazon Prime', icon: 'A', color: '#FF9900', category: 'Shopping', typicalAmount: 14.99, billingCycle: 'monthly' },
  { name: 'Disney+', icon: 'D', color: '#113CCF', category: 'Entertainment', typicalAmount: 13.99, billingCycle: 'monthly' },
  { name: 'HBO', icon: 'H', color: '#B01EE5', category: 'Entertainment', typicalAmount: 15.99, billingCycle: 'monthly' },
  { name: 'Apple Music', icon: 'A', color: '#FC3C44', category: 'Entertainment', typicalAmount: 10.99, billingCycle: 'monthly' },
  { name: 'YouTube Premium', icon: 'Y', color: '#FF0000', category: 'Entertainment', typicalAmount: 13.99, billingCycle: 'monthly' },
  { name: 'iCloud', icon: 'i', color: '#3693F5', category: 'Utilities', typicalAmount: 2.99, billingCycle: 'monthly' },
  { name: 'Adobe CC', icon: 'A', color: '#FF0000', category: 'Education', typicalAmount: 54.99, billingCycle: 'monthly' },
  { name: 'Microsoft 365', icon: 'M', color: '#00A4EF', category: 'Education', typicalAmount: 9.99, billingCycle: 'monthly' },
  { name: 'Slack', icon: 'S', color: '#4A154B', category: 'Business', typicalAmount: 8.75, billingCycle: 'monthly' },
  { name: 'GitHub', icon: 'G', color: '#24292E', category: 'Education', typicalAmount: 4.0, billingCycle: 'monthly' },
  { name: 'Notion', icon: 'N', color: '#000000', category: 'Productivity', typicalAmount: 10.0, billingCycle: 'monthly' },
  { name: 'Figma', icon: 'F', color: '#F24E1E', category: 'Education', typicalAmount: 15.0, billingCycle: 'monthly' },
  { name: 'ChatGPT Plus', icon: 'C', color: '#10A37F', category: 'Productivity', typicalAmount: 20.0, billingCycle: 'monthly' },
]

function findPreset(name: string): SubscriptionPreset | undefined {
  return SUBSCRIPTION_PRESETS.find(
    (p) => p.name.toLowerCase() === name.toLowerCase(),
  )
}

// ============================================================================
// Form Schema
// ============================================================================

const subscriptionFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  billingCycle: z.enum(['monthly', 'yearly', 'weekly']),
  nextBillingDate: z.string().min(1, 'Next billing date is required'),
  category: z.string().optional(),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
})

type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>

// ============================================================================
// Constants
// ============================================================================

const SUBSCRIPTION_CATEGORIES = [
  'Entertainment',
  'Shopping',
  'Education',
  'Utilities',
  'Business',
  'Productivity',
  'Health & Fitness',
  'Insurance',
  'Other',
]

const BILLING_CYCLE_BADGE: Record<string, string> = {
  weekly: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400 border-sky-200 dark:border-sky-800',
  monthly: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  yearly: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
}

const SORT_OPTIONS = [
  { value: 'nextBillingDate', label: 'Next Billing' },
  { value: 'amount', label: 'Amount' },
  { value: 'name', label: 'Name' },
] as const

type SortField = (typeof SORT_OPTIONS)[number]['value']

// ============================================================================
// Animations
// ============================================================================

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: 'easeOut' },
  }),
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

// ============================================================================
// Subscription Icon
// ============================================================================

function SubscriptionIcon({
  name,
  icon,
  color,
  size = 'md',
}: {
  name: string
  icon?: string | null
  color?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const preset = findPreset(name)
  const resolvedIcon = icon || preset?.icon || name.charAt(0).toUpperCase()
  const resolvedColor = color || preset?.color || '#6b7280'

  const sizeClass = {
    sm: 'size-8 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-12 text-base',
  }[size]

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-sm`}
      style={{ backgroundColor: resolvedColor }}
    >
      {resolvedIcon}
    </div>
  )
}

// ============================================================================
// Countdown Badge
// ============================================================================

function CountdownBadge({ date }: { date: Date | string }) {
  const days = differenceInDays(parseISO(date as string), new Date())

  let variant: 'urgent' | 'soon' | 'normal' = 'normal'
  if (days <= 3) variant = 'urgent'
  else if (days <= 7) variant = 'soon'

  const classMap = {
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    soon: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    normal: 'bg-muted text-muted-foreground',
  }

  const label =
    days < 0
      ? `${Math.abs(days)}d overdue`
      : days === 0
        ? 'Today'
        : days === 1
          ? 'Tomorrow'
          : `${days}d left`

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${classMap[variant]}`}
    >
      <Clock className="size-3" />
      {label}
    </span>
  )
}

// ============================================================================
// Monthly Equivalent
// ============================================================================

function getMonthlyEquivalent(
  amount: number,
  billingCycle: 'weekly' | 'monthly' | 'yearly',
): number {
  if (billingCycle === 'weekly') return amount * 4.33
  if (billingCycle === 'yearly') return amount / 12
  return amount
}

function getPerCycleLabel(
  billingCycle: 'weekly' | 'monthly' | 'yearly',
): string {
  if (billingCycle === 'weekly') return '/wk'
  if (billingCycle === 'yearly') return '/yr'
  return '/mo'
}

// ============================================================================
// Subscription Form Sheet
// ============================================================================

function SubscriptionFormSheet({
  open,
  onOpenChange,
  editingSubscription,
  onSubmit,
  isSubmitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingSubscription: Subscription | null
  onSubmit: (data: SubscriptionFormValues) => void
  isSubmitting: boolean
}) {
  const [presetOpen, setPresetOpen] = React.useState(false)
  const [calendarOpen, setCalendarOpen] = React.useState(false)

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      name: '',
      amount: undefined as unknown as number,
      billingCycle: 'monthly',
      nextBillingDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      category: '',
      url: '',
      notes: '',
    },
  })

  const watchedName = form.watch('name')
  const matchedPreset = findPreset(watchedName)

  // Populate form when editing
  React.useEffect(() => {
    if (editingSubscription) {
      form.reset({
        name: editingSubscription.name,
        amount: editingSubscription.amount,
        billingCycle: editingSubscription.billingCycle,
        nextBillingDate: format(
          parseISO(editingSubscription.nextBillingDate as unknown as string),
          'yyyy-MM-dd',
        ),
        category: editingSubscription.category || '',
        url: editingSubscription.url || '',
        notes: editingSubscription.notes || '',
      })
    } else {
      form.reset({
        name: '',
        amount: undefined as unknown as number,
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        category: '',
        url: '',
        notes: '',
      })
    }
  }, [editingSubscription, form, open])

  const handlePresetSelect = (preset: SubscriptionPreset) => {
    form.setValue('name', preset.name)
    form.setValue('amount', preset.typicalAmount)
    form.setValue('billingCycle', preset.billingCycle)
    form.setValue('category', preset.category)
    setPresetOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="pr-6">
          <SheetTitle>
            {editingSubscription ? 'Edit Subscription' : 'Add Subscription'}
          </SheetTitle>
          <SheetDescription>
            {editingSubscription
              ? 'Update your subscription details.'
              : 'Add a new recurring subscription to track.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 px-4"
          >
            {/* Preset Picker */}
            {!editingSubscription && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Quick Add Preset
                </Label>
                <Popover open={presetOpen} onOpenChange={setPresetOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <Sparkles className="size-4 text-amber-500" />
                      {matchedPreset
                        ? `Detected: ${matchedPreset.name}`
                        : 'Choose a popular service...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search services..." />
                      <CommandList>
                        <CommandEmpty>No service found.</CommandEmpty>
                        <CommandGroup>
                          {SUBSCRIPTION_PRESETS.map((preset) => (
                            <CommandItem
                              key={preset.name}
                              value={preset.name}
                              onSelect={() => handlePresetSelect(preset)}
                              className="flex items-center gap-3"
                            >
                              <SubscriptionIcon
                                name={preset.name}
                                icon={preset.icon}
                                color={preset.color}
                                size="sm"
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {preset.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatCurrency(preset.typicalAmount)}
                                  {getPerCycleLabel(preset.billingCycle)}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Netflix, Spotify..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount + Billing Cycle */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
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
                name="billingCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Cycle</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SUBSCRIPTION_BILLING_CYCLES.map((cycle) => (
                          <SelectItem key={cycle.value} value={cycle.value}>
                            {cycle.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Next Billing Date */}
            <FormField
              control={form.control}
              name="nextBillingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Billing Date</FormLabel>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {field.value
                            ? formatDate(field.value)
                            : 'Pick a date'}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          field.value
                            ? parseISO(field.value)
                            : undefined
                        }
                        onSelect={(d) => {
                          if (d) {
                            field.onChange(format(d, 'yyyy-MM-dd'))
                            setCalendarOpen(false)
                          }
                        }}
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUBSCRIPTION_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* URL */}
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://..."
                      {...field}
                    />
                  </FormControl>
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
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {editingSubscription ? 'Update' : 'Add Subscription'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

// ============================================================================
// Subscription Card (Mobile)
// ============================================================================

function SubscriptionCard({
  subscription,
  currency,
  index,
  onEdit,
  onDelete,
}: {
  subscription: Subscription
  currency: string
  index: number
  onEdit: (sub: Subscription) => void
  onDelete: (sub: Subscription) => void
}) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <SubscriptionIcon
              name={subscription.name}
              icon={subscription.icon}
              color={subscription.color}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="truncate text-sm font-semibold">
                  {subscription.name}
                </h4>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={BILLING_CYCLE_BADGE[subscription.billingCycle]}
                  >
                    {subscription.billingCycle}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="6" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="18" r="1.5" />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(subscription)}>
                        <Pencil className="mr-2 size-4" />
                        Edit
                      </DropdownMenuItem>
                      {subscription.url && (
                        <DropdownMenuItem asChild>
                          <a
                            href={subscription.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 size-4" />
                            Visit Site
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 dark:text-red-400"
                        onClick={() => onDelete(subscription)}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold">
                  {formatCurrency(subscription.amount, currency)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {getPerCycleLabel(subscription.billingCycle)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <CountdownBadge date={subscription.nextBillingDate} />
                <span className="text-xs text-muted-foreground">
                  {formatDate(subscription.nextBillingDate)}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2">
                {subscription.category && (
                  <Badge variant="secondary" className="text-xs">
                    {subscription.category}
                  </Badge>
                )}
                <Badge
                  variant={
                    subscription.isActive ? 'default' : 'secondary'
                  }
                  className={`text-xs ${
                    subscription.isActive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : ''
                  }`}
                >
                  {subscription.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ============================================================================
// Subscription Table Row (Desktop)
// ============================================================================

function SubscriptionTableRow({
  subscription,
  currency,
  index,
  onEdit,
  onDelete,
}: {
  subscription: Subscription
  currency: string
  index: number
  onEdit: (sub: Subscription) => void
  onDelete: (sub: Subscription) => void
}) {
  return (
    <motion.tr
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className="group border-b border-border/30 transition-all duration-200 last:border-0 hover:bg-muted/30"
    >
      <TableCell className="w-12">
        <SubscriptionIcon
          name={subscription.name}
          icon={subscription.icon}
          color={subscription.color}
          size="sm"
        />
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{subscription.name}</span>
          {subscription.category && (
            <span className="text-xs text-muted-foreground">
              {subscription.category}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end">
          <span className="font-semibold">
            {formatCurrency(subscription.amount, currency)}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatCurrency(
              getMonthlyEquivalent(
                subscription.amount,
                subscription.billingCycle,
              ),
              currency,
            )}
            /mo equiv.
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={BILLING_CYCLE_BADGE[subscription.billingCycle]}
        >
          {subscription.billingCycle.charAt(0).toUpperCase() +
            subscription.billingCycle.slice(1)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span className="text-sm">
            {formatDate(subscription.nextBillingDate)}
          </span>
          <CountdownBadge date={subscription.nextBillingDate} />
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={subscription.isActive ? 'default' : 'secondary'}
          className={`text-xs ${
            subscription.isActive
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
              : ''
          }`}
        >
          {subscription.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="6" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="18" r="1.5" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(subscription)}>
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            {subscription.url && (
              <DropdownMenuItem asChild>
                <a
                  href={subscription.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 size-4" />
                  Visit Site
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 dark:text-red-400"
              onClick={() => onDelete(subscription)}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  )
}

// ============================================================================
// Upcoming Renewals
// ============================================================================

function UpcomingRenewals({
  subscriptions,
  currency,
}: {
  subscriptions: Subscription[]
  currency: string
}) {
  const now = new Date()
  const thirtyDaysLater = addDays(now, 30)

  const upcoming = subscriptions
    .filter((sub) => {
      if (!sub.isActive) return false
      const next = parseISO(sub.nextBillingDate as unknown as string)
      return (
        isAfter(next, startOfDay(now)) &&
        isBefore(next, endOfDay(thirtyDaysLater))
      )
    })
    .sort(
      (a, b) =>
        new Date(a.nextBillingDate).getTime() -
        new Date(b.nextBillingDate).getTime(),
    )

  if (upcoming.length === 0) return null

  const totalUpcoming = upcoming.reduce(
    (sum, sub) => sum + sub.amount,
    0,
  )

  return (
    <Card className="rounded-2xl border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-4 text-amber-500" />
            Upcoming Renewals (30 days)
          </CardTitle>
          <span className="text-sm font-semibold">
            {formatCurrency(totalUpcoming, currency)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {upcoming.map((sub) => {
              const days = differenceInDays(
                parseISO(sub.nextBillingDate as unknown as string),
                now,
              )
              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 rounded-xl border border-border/40 p-3.5 transition-all duration-200 hover:bg-muted/30 hover:shadow-sm"
                >
                  <SubscriptionIcon
                    name={sub.name}
                    icon={sub.icon}
                    color={sub.color}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {sub.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(sub.nextBillingDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatCurrency(sub.amount, currency)}
                    </p>
                    <CountdownBadge date={sub.nextBillingDate} />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Sort Icon (must be outside component to satisfy React Compiler)
// ============================================================================

function SortIcon({
  field,
  currentSortField,
  currentSortOrder,
}: {
  field: SortField
  currentSortField: SortField
  currentSortOrder: 'asc' | 'desc'
}) {
  if (currentSortField !== field)
    return <ArrowUpDown className="ml-1 size-3 opacity-50" />
  return currentSortOrder === 'asc' ? (
    <ArrowUp className="ml-1 size-3" />
  ) : (
    <ArrowDown className="ml-1 size-3" />
  )
}

// ============================================================================
// Main Page
// ============================================================================

function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function SubscriptionsPage() {
  const { user } = useRouterStore()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const currency = user?.currency || APP_CONFIG.DEFAULT_CURRENCY

  // ---- Sort state ----
  const [sortField, setSortField] = React.useState<SortField>('nextBillingDate')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc')
  const [inactiveOpen, setInactiveOpen] = React.useState(false)

  // ---- Dialog state ----
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingSubscription, setEditingSubscription] =
    React.useState<Subscription | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Subscription | null>(
    null,
  )

  // ---- Data ----
  const params: PaginationParams = {
    page: 1,
    limit: 100,
    sortBy: sortField,
    sortOrder,
  }

  const { data, isLoading, isError } = useSubscriptions(params)
  const subscriptions = data?.data ?? []

  const activeSubscriptions = React.useMemo(
    () => subscriptions.filter((s) => s.isActive),
    [subscriptions],
  )
  const inactiveSubscriptions = React.useMemo(
    () => subscriptions.filter((s) => !s.isActive),
    [subscriptions],
  )

  // ---- Computed stats ----
  const totalMonthly = React.useMemo(
    () =>
      activeSubscriptions.reduce(
        (sum, sub) =>
          sum + getMonthlyEquivalent(sub.amount, sub.billingCycle),
        0,
      ),
    [activeSubscriptions],
  )

  const nextRenewal = React.useMemo(() => {
    const now = new Date()
    const future = activeSubscriptions
      .filter((s) => isAfter(parseISO(s.nextBillingDate as unknown as string), now))
      .sort(
        (a, b) =>
          new Date(a.nextBillingDate).getTime() -
          new Date(b.nextBillingDate).getTime(),
      )
    return future[0]?.nextBillingDate ?? null
  }, [activeSubscriptions])

  // ---- Mutations ----
  const createMutation = useCreateSubscription()
  const updateMutation = useUpdateSubscription()
  const deleteMutation = useDeleteSubscription()

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // ---- Handlers ----
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }



  const openCreateForm = () => {
    setEditingSubscription(null)
    setFormOpen(true)
  }

  const openEditForm = (sub: Subscription) => {
    setEditingSubscription(sub)
    setFormOpen(true)
  }

  const handleFormSubmit = (values: SubscriptionFormValues) => {
    const payload: SubscriptionCreate = {
      name: values.name,
      amount: values.amount,
      billingCycle: values.billingCycle,
      nextBillingDate: values.nextBillingDate,
      category: values.category || undefined,
      url: values.url || undefined,
      notes: values.notes || undefined,
    }

    if (editingSubscription) {
      updateMutation.mutate(
        { id: editingSubscription.id, data: payload },
        { onSuccess: () => setFormOpen(false) },
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setFormOpen(false),
      })
    }
  }

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
      })
    }
  }

  // ---- Loading ----
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Subscriptions" />
        <div className="grid gap-4 sm:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
        <ListSkeleton count={5} />
      </div>
    )
  }

  // ---- Empty ----
  if (subscriptions.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Subscriptions"
          actions={
            <Button className="rounded-xl h-11 shadow-sm" onClick={openCreateForm}>
              <Plus className="mr-2 size-4" />
              Add Subscription
            </Button>
          }
        />
        <EmptyState
          icon={Repeat}
          title="Track your subscriptions"
          description="Add your recurring subscriptions to keep track of monthly costs and never miss a renewal date."
          actionLabel="Add Your First Subscription"
          onAction={openCreateForm}
        />
      </div>
    )
  }

  // ---- Render ----
  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        description="Manage and track your recurring expenses"
        actions={
          <Button className="rounded-xl h-11" onClick={openCreateForm}>
            <Plus className="mr-2 size-4" />
            Add Subscription
          </Button>
        }
      />

      {/* ---- Stat Cards ---- */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={CreditCard}
          title="Monthly Cost"
          value={formatCurrency(totalMonthly, currency)}
          iconBgColor="bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={Repeat}
          title="Active Subscriptions"
          value={String(activeSubscriptions.length)}
          iconBgColor="bg-violet-500/10"
          iconColor="text-violet-600 dark:text-violet-400"
        />
        <StatCard
          icon={CalendarClock}
          title="Next Renewal"
          value={nextRenewal ? formatDate(nextRenewal) : 'None'}
          iconBgColor="bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* ---- Upcoming Renewals ---- */}
      <UpcomingRenewals subscriptions={subscriptions} currency={currency} />

      {/* ---- Active Subscriptions ---- */}
      <Card className="rounded-2xl border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Active Subscriptions
              <Badge variant="secondary" className="ml-2">
                {activeSubscriptions.length}
              </Badge>
            </CardTitle>
            {/* Desktop sort buttons */}
            {!isMobile && (
              <div className="flex items-center gap-1">
                {SORT_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={
                      sortField === opt.value ? 'secondary' : 'ghost'
                    }
                    size="sm"
                    onClick={() => handleSort(opt.value)}
                    className="h-8 text-xs"
                  >
                    {opt.label}
                    <SortIcon field={opt.value} currentSortField={sortField} currentSortOrder={sortOrder} />
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {isMobile ? (
            <div className="space-y-3">
              {/* Mobile sort dropdown */}
              <div className="flex items-center justify-end">
                <Select
                  value={sortField}
                  onValueChange={(v) =>
                    handleSort(v as SortField)
                  }
                >
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <AnimatePresence>
                {activeSubscriptions.map((sub, i) => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    currency={currency}
                    index={i}
                    onEdit={openEditForm}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    <button
                      className="inline-flex items-center font-medium"
                      onClick={() => handleSort('name')}
                    >
                      Name
                      <SortIcon field="name" currentSortField={sortField} currentSortOrder={sortOrder} />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      className="inline-flex items-center font-medium"
                      onClick={() => handleSort('amount')}
                    >
                      Amount
                      <SortIcon field="amount" currentSortField={sortField} currentSortOrder={sortOrder} />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Cycle</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    <button
                      className="inline-flex items-center font-medium"
                      onClick={() => handleSort('nextBillingDate')}
                    >
                      Next Billing
                      <SortIcon field="nextBillingDate" currentSortField={sortField} currentSortOrder={sortOrder} />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {activeSubscriptions.map((sub, i) => (
                    <SubscriptionTableRow
                      key={sub.id}
                      subscription={sub}
                      currency={currency}
                      index={i}
                      onEdit={openEditForm}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ---- Inactive Subscriptions (Collapsible) ---- */}
      {inactiveSubscriptions.length > 0 && (
        <Collapsible open={inactiveOpen} onOpenChange={setInactiveOpen}>
          <Card className="rounded-2xl border-border/40">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer select-none pb-3 transition-colors hover:bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    Inactive Subscriptions
                    <Badge variant="secondary">
                      {inactiveSubscriptions.length}
                    </Badge>
                  </CardTitle>
                  <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform duration-200 ${inactiveOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4">
                {isMobile ? (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {inactiveSubscriptions.map((sub, i) => (
                        <SubscriptionCard
                          key={sub.id}
                          subscription={sub}
                          currency={currency}
                          index={i}
                          onEdit={openEditForm}
                          onDelete={setDeleteTarget}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Table>
                    <TableBody>
                      <AnimatePresence>
                        {inactiveSubscriptions.map((sub, i) => (
                          <SubscriptionTableRow
                            key={sub.id}
                            subscription={sub}
                            currency={currency}
                            index={i}
                            onEdit={openEditForm}
                            onDelete={setDeleteTarget}
                          />
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* ---- Form Sheet ---- */}
      <SubscriptionFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        editingSubscription={editingSubscription}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      {/* ---- Delete Confirm ---- */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete Subscription"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

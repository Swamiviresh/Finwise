'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  Globe,
  Languages,
} from 'lucide-react'
import { useRouterStore } from '@/store/router-store'
import { useSettings, useUpdateSettings } from '@/hooks/use-settings'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { CURRENCY_CODES, LANGUAGES } from '@/lib/constants'
import type { SettingsInput } from '@/types'

// ---------------------------------------------------------------------------
// Change Password Schema
// ---------------------------------------------------------------------------

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ChangePasswordValues = z.infer<typeof changePasswordSchema>

// ---------------------------------------------------------------------------
// Date Formats
// ---------------------------------------------------------------------------

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (DE)' },
]

// ---------------------------------------------------------------------------
// Theme Option
// ---------------------------------------------------------------------------

interface ThemeOptionProps {
  value: string
  label: string
  icon: React.ReactNode
  selected: boolean
  onClick: () => void
}

function ThemeOption({ value, label, icon, selected, onClick }: ThemeOptionProps) {
  return (
    <label
      htmlFor={`theme-${value}`}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all hover:bg-accent',
        selected && 'border-primary bg-primary/5 ring-1 ring-primary',
      )}
    >
      <RadioGroupItem value={value} id={`theme-${value}`} />
      <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </label>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SettingsPage() {
  const { user } = useRouterStore()
  const { theme, setTheme } = useTheme()
  const { data: settingsData, isLoading: settingsLoading } = useSettings()
  const updateSettings = useUpdateSettings()

  const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false)
  const [showNewPassword, setShowNewPassword] = React.useState(false)

  const settings = settingsData?.data ?? null

  // --- Local settings state (updated individually per section) ---
  const [localTheme, setLocalTheme] = React.useState(settings?.theme || 'system')
  const [localCurrency, setLocalCurrency] = React.useState(settings?.currency || 'USD')
  const [localLanguage, setLocalLanguage] = React.useState(settings?.language || 'en')
  const [localDateFormat, setLocalDateFormat] = React.useState('MM/DD/YYYY')
  const [localNotifications, setLocalNotifications] = React.useState(
    settings?.enableNotifications ?? true,
  )
  const [localEmailDigest, setLocalEmailDigest] = React.useState(
    settings?.enableEmailDigest ?? true,
  )
  const [localBudgetThreshold, setLocalBudgetThreshold] = React.useState(
    settings?.budgetAlertThreshold ?? 80,
  )
  const [localWeeklyReport, setLocalWeeklyReport] = React.useState(
    settings?.weeklyReportEnabled ?? true,
  )

  // Sync from server data
  React.useEffect(() => {
    if (settings) {
      setLocalTheme(settings.theme || 'system')
      setLocalCurrency(settings.currency || 'USD')
      setLocalLanguage(settings.language || 'en')
      setLocalNotifications(settings.enableNotifications)
      setLocalEmailDigest(settings.enableEmailDigest)
      setLocalBudgetThreshold(settings.budgetAlertThreshold)
      setLocalWeeklyReport(settings.weeklyReportEnabled)
    }
  }, [settings])

  // --- Sync theme ---
  React.useEffect(() => {
    if (theme) setLocalTheme(theme)
  }, [theme])

  // --- Save helper ---
  const saveSetting = React.useCallback(
    (patch: SettingsInput) => {
      updateSettings.mutate(patch)
    },
    [updateSettings],
  )

  // --- Password form ---
  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onPasswordSubmit = React.useCallback(
    (data: ChangePasswordValues) => {
      // Simulated — in production call the API
      toast.success('Password changed successfully')
      setPasswordDialogOpen(false)
      passwordForm.reset()
    },
    [passwordForm],
  )

  // --- Loading skeleton ---
  if (settingsLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 p-6"
      >
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 p-6"
    >
      {/* Page Header */}
      <PageHeader
        title="Settings"
        description="Customize your FinWise experience"
        breadcrumbs={[
          { label: 'Dashboard', href: '#dashboard' },
          { label: 'Settings' },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ================================================================ */}
        {/* Appearance                                                       */}
        {/* ================================================================ */}
        <Card className="rounded-2xl border-border/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <Palette className="size-4 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2.5 text-base">Appearance</CardTitle>
                <CardDescription className="text-xs">
                  Customize how FinWise looks
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={localTheme}
              onValueChange={(val) => {
                setLocalTheme(val as 'light' | 'dark' | 'system')
                setTheme(val)
                saveSetting({ theme: val as 'light' | 'dark' | 'system' })
              }}
              className="grid gap-3 sm:grid-cols-3"
            >
              <ThemeOption
                value="light"
                label="Light"
                selected={localTheme === 'light'}
                onClick={() => {
                  setTheme('light')
                  saveSetting({ theme: 'light' })
                }}
                icon={<Sun className="size-4 text-amber-500" />}
              />
              <ThemeOption
                value="dark"
                label="Dark"
                selected={localTheme === 'dark'}
                onClick={() => {
                  setTheme('dark')
                  saveSetting({ theme: 'dark' })
                }}
                icon={<Moon className="size-4 text-violet-500" />}
              />
              <ThemeOption
                value="system"
                label="System"
                selected={localTheme === 'system'}
                onClick={() => {
                  setTheme('system')
                  saveSetting({ theme: 'system' })
                }}
                icon={<Monitor className="size-4 text-sky-500" />}
              />
            </RadioGroup>

            {/* Theme Preview */}
            <div className="rounded-lg border p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Preview
              </p>
              <div
                className={cn(
                  'rounded-md border p-3 transition-colors',
                  localTheme === 'dark'
                    ? 'bg-zinc-900 text-zinc-100'
                    : localTheme === 'light'
                      ? 'bg-white text-zinc-900'
                      : 'bg-gradient-to-r from-white to-zinc-900 text-zinc-600',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-primary/20" />
                    <div className="h-2.5 w-20 rounded bg-current opacity-40" />
                  </div>
                  <div className="h-2.5 w-10 rounded bg-current opacity-20" />
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className="h-2 w-full rounded bg-current opacity-10" />
                  <div className="h-2 w-3/4 rounded bg-current opacity-10" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* Currency & Language                                              */}
        {/* ================================================================ */}
        <Card className="rounded-2xl border-border/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="size-4 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2.5 text-base">Currency & Language</CardTitle>
                <CardDescription className="text-xs">
                  Set your regional preferences
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Currency */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Currency</Label>
              <Select
                value={localCurrency}
                onValueChange={(val) => {
                  setLocalCurrency(val)
                  saveSetting({ currency: val })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_CODES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Language</Label>
              <Select
                value={localLanguage}
                onValueChange={(val) => {
                  setLocalLanguage(val)
                  saveSetting({ language: val })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Format */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Format</Label>
              <Select
                value={localDateFormat}
                onValueChange={setLocalDateFormat}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((df) => (
                    <SelectItem key={df.value} value={df.value}>
                      {df.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

      </div>
    </motion.div>
  )
}

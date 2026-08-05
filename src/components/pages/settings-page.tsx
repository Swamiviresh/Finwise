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
  Bell,
  Mail,
  SlidersHorizontal,
  FileBarChart2,
  Shield,
  Lock,
  Smartphone,
  Download,
  Loader2,
  Save,
  Eye,
  EyeOff,
  Check,
  Zap,
} from 'lucide-react'
import { useRouterStore } from '@/store/router-store'
import { useSettings, useUpdateSettings, useExportData } from '@/hooks/use-settings'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
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
  const exportData = useExportData()

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

        {/* ================================================================ */}
        {/* Notification Preferences                                         */}
        {/* ================================================================ */}
        <Card className="rounded-2xl border-border/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="size-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-xs">
                  Control how you receive alerts
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Enable Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Zap className="size-3.5 text-muted-foreground" />
                  Push Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive real-time alerts for important events
                </p>
              </div>
              <Switch
                checked={localNotifications}
                onCheckedChange={(checked) => {
                  setLocalNotifications(checked)
                  saveSetting({ enableNotifications: checked })
                }}
              />
            </div>

            <Separator />

            {/* Email Digest */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="size-3.5 text-muted-foreground" />
                  Email Digest
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive a weekly summary of your finances via email
                </p>
              </div>
              <Switch
                checked={localEmailDigest}
                onCheckedChange={(checked) => {
                  setLocalEmailDigest(checked)
                  saveSetting({ enableEmailDigest: checked })
                }}
              />
            </div>

            <Separator />

            {/* Budget Alert Threshold */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                  Budget Alert Threshold
                </Label>
                <Badge variant="secondary">{localBudgetThreshold}%</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Get notified when spending reaches this percentage of your budget
              </p>
              <Slider
                value={[localBudgetThreshold]}
                onValueChange={([val]) => {
                  setLocalBudgetThreshold(val)
                  saveSetting({ budgetAlertThreshold: val })
                }}
                min={50}
                max={100}
                step={5}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>50% — Early warning</span>
                <span>100% — Budget exceeded</span>
              </div>
            </div>

            <Separator />

            {/* Weekly Report */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <FileBarChart2 className="size-3.5 text-muted-foreground" />
                  Weekly Financial Report
                </Label>
                <p className="text-xs text-muted-foreground">
                  Auto-generate a weekly spending report every Sunday
                </p>
              </div>
              <Switch
                checked={localWeeklyReport}
                onCheckedChange={(checked) => {
                  setLocalWeeklyReport(checked)
                  saveSetting({ weeklyReportEnabled: checked })
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* Privacy & Security                                               */}
        {/* ================================================================ */}
        <Card className="rounded-2xl border-border/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="size-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">
                  Privacy & Security
                </CardTitle>
                <CardDescription className="text-xs">
                  Manage your account security settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Change Password */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Lock className="size-3.5 text-muted-foreground" />
                  Password
                </Label>
                <p className="text-xs text-muted-foreground">
                  Last changed 30 days ago
                </p>
              </div>
              <Dialog
                open={passwordDialogOpen}
                onOpenChange={setPasswordDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Lock className="size-3.5" />
                    Change
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl border-border/40" >
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and choose a new one
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...passwordForm}>
                    <form
                      onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                      className="space-y-4"
                    >
                      {/* Current Password */}
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  type={
                                    showCurrentPassword ? 'text' : 'password'
                                  }
                                  placeholder="Enter current password"
                                  {...field}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-0 right-0 size-9"
                                onClick={() =>
                                  setShowCurrentPassword(!showCurrentPassword)
                                }
                              >
                                {showCurrentPassword ? (
                                  <EyeOff className="size-4" />
                                ) : (
                                  <Eye className="size-4" />
                                )}
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* New Password */}
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  type={
                                    showNewPassword ? 'text' : 'password'
                                  }
                                  placeholder="Enter new password"
                                  {...field}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-0 right-0 size-9"
                                onClick={() =>
                                  setShowNewPassword(!showNewPassword)
                                }
                              >
                                {showNewPassword ? (
                                  <EyeOff className="size-4" />
                                ) : (
                                  <Eye className="size-4" />
                                )}
                              </Button>
                            </div>
                            <FormDescription>
                              Min 8 chars, uppercase, lowercase, and number
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Confirm Password */}
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Confirm new password"
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
                          onClick={() => setPasswordDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={passwordForm.formState.isSubmitting}
                          className="gap-2"
                        >
                          {passwordForm.formState.isSubmitting ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Check className="size-4" />
                              Update Password
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Separator />

            {/* Two-Factor Auth */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Smartphone className="size-3.5 text-muted-foreground" />
                  Two-Factor Authentication
                </Label>
                <p className="text-xs text-muted-foreground">
                  Add an extra layer of security
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Coming Soon
                </Badge>
                <Switch disabled />
              </div>
            </div>

            <Separator />

            {/* Active Sessions */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Smartphone className="size-3.5 text-muted-foreground" />
                Active Sessions
              </Label>
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                      <Monitor className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Current session</p>
                      <p className="text-xs text-muted-foreground">
                        This device &middot; Active now
                      </p>
                    </div>
                  </div>
                  <Badge variant="default" className="text-xs">
                    Current
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Export Data */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Download className="size-3.5 text-muted-foreground" />
                  Export Data
                </Label>
                <p className="text-xs text-muted-foreground">
                  Download all your data in JSON or CSV format
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => exportData.mutate('json')}
                  disabled={exportData.isPending}
                >
                  {exportData.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Download className="size-3.5" />
                  )}
                  JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => exportData.mutate('csv')}
                  disabled={exportData.isPending}
                >
                  CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

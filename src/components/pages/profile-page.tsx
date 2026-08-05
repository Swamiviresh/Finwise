'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Globe,
  Clock,
  Languages,
  Camera,
  CalendarDays,
  Shield,
  ShieldCheck,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react'
import { useRouterStore } from '@/store/router-store'
import { useAuth } from '@/hooks/use-auth'
import { useProfile, useUpdateProfile } from '@/hooks/use-settings'
import { PageHeader } from '@/components/shared/page-header'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CURRENCY_CODES, TIMEZONES, LANGUAGES } from '@/lib/constants'
import { profileSchema } from '@/lib/validators'
import type { ProfileInput } from '@/types'

// ---------------------------------------------------------------------------
// Profile form schema (extended with email for display, not submission)
// ---------------------------------------------------------------------------

const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email(), // display only
  phone: z.string().max(20, 'Phone is too long').optional().or(z.literal('')),
  occupation: z.string().max(100, 'Occupation is too long').optional().or(z.literal('')),
  currency: z.string().length(3, 'Select a valid currency'),
  timezone: z.string().min(1, 'Select a timezone'),
  language: z.string().length(2, 'Select a language'),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfilePage() {
  const { user, isAuthenticated } = useRouterStore()
  const { logout } = useAuth()
  const { data: profileData, isLoading: profileLoading } = useProfile()
  const updateProfile = useUpdateProfile()

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [avatarUploading, setAvatarUploading] = React.useState(false)

  const profile = profileData?.data ?? null

  // --- Form ---
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      occupation: '',
      currency: 'USD',
      timezone: 'UTC',
      language: 'en',
    },
    values: profile
      ? {
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          occupation: profile.occupation || '',
          currency: profile.currency || 'USD',
          timezone: profile.timezone || 'UTC',
          language: profile.language || 'en',
        }
      : undefined,
  })

  // --- Submit ---
  const onSubmit = React.useCallback(
    (data: ProfileFormValues) => {
      const payload: ProfileInput = {
        name: data.name,
        phone: data.phone || undefined,
        occupation: data.occupation || undefined,
        currency: data.currency,
        timezone: data.timezone,
        language: data.language,
      }
      updateProfile.mutate(payload)
    },
    [updateProfile],
  )

  // --- Avatar upload simulation ---
  const handleAvatarUpload = React.useCallback(() => {
    setAvatarUploading(true)
    // Simulated upload — in production this would call an upload API
    setTimeout(() => {
      setAvatarUploading(false)
      toast.info('Avatar upload is simulated in this demo')
    }, 1500)
  }, [])

  // --- Delete account ---
  const handleDeleteAccount = React.useCallback(() => {
    setDeleteDialogOpen(false)
    toast.info('Account deletion is simulated in this demo')
  }, [])

  // --- Member since ---
  const memberSince = user?.createdAt
    ? format(new Date(user.createdAt), 'MMMM d, yyyy')
    : 'N/A'

  // --- Loading skeleton ---
  if (profileLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 p-6"
      >
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </motion.div>
    )
  }

  const displayName = profile?.name || user?.name || 'User'
  const displayEmail = profile?.email || user?.email || ''
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 p-6"
    >
      {/* Page Header */}
      <PageHeader
        title="Profile"
        description="Manage your personal information and preferences"
        breadcrumbs={[
          { label: 'Dashboard', href: '#dashboard' },
          { label: 'Profile' },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — Avatar + Account Info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Avatar Card */}
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <div className="relative">
                <Avatar className="size-24">
                  {profile?.avatar && (
                    <AvatarImage src={profile.avatar} alt={displayName} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute -bottom-1 -right-1 size-8 rounded-full border-2 border-background shadow-sm"
                  onClick={handleAvatarUpload}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Camera className="size-3.5" />
                  )}
                </Button>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">{displayName}</h3>
                <p className="text-sm text-muted-foreground">{displayEmail}</p>
              </div>
              <Badge variant="secondary" className="mt-1">
                <Shield className="mr-1 size-3" />
                {user?.role === 'admin' ? 'Admin' : 'User'}
              </Badge>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="size-4" />
                  Member since
                </div>
                <span className="text-sm font-medium">{memberSince}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="size-4" />
                  Account status
                </div>
                <Badge
                  variant={user?.isActive !== false ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {user?.isActive !== false ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="size-4" />
                  Email verified
                </div>
                {user?.emailVerified ? (
                  <Badge variant="default" className="gap-1 text-xs">
                    <CheckCircle2 className="size-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1 text-xs">
                    <AlertCircle className="size-3" />
                    Not verified
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-destructive">
                Danger Zone
              </CardTitle>
              <CardDescription className="text-xs">
                Irreversible actions for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right column — Profile Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="gap-1.5">
                          <User className="size-3.5" />
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email (disabled) */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="gap-1.5">
                          <Mail className="size-3.5" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormDescription>
                          Change email via settings
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="gap-1.5">
                          <Phone className="size-3.5" />
                          Phone
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Occupation */}
                  <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="gap-1.5">
                          <Briefcase className="size-3.5" />
                          Occupation
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Software Engineer"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Currency */}
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="gap-1.5">
                          <Globe className="size-3.5" />
                          Currency
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCY_CODES.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.symbol} {c.code} — {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Language */}
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="gap-1.5">
                          <Languages className="size-3.5" />
                          Language
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LANGUAGES.map((l) => (
                              <SelectItem key={l.code} value={l.code}>
                                {l.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Timezone */}
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="gap-1.5">
                        <Clock className="size-3.5" />
                        Timezone
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Save */}
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={updateProfile.isPending}
                    className="gap-2"
                  >
                    {updateProfile.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="size-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Account"
        description="Are you sure you want to delete your account? This action is permanent and cannot be undone. All your data, transactions, budgets, and goals will be permanently deleted."
        confirmLabel="Delete Account"
        variant="destructive"
        onConfirm={handleDeleteAccount}
      />
    </motion.div>
  )
}

'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Wallet, Loader2, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouterStore } from '@/store/router-store'
import { useAuth } from '@/hooks/use-auth'
import { registerSchema } from '@/lib/validators'
import type { RegisterInput } from '@/types'
import { AppRoute } from '@/types'
import { AuthLayout } from '@/components/pages/auth-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

// ---------------------------------------------------------------------------
// Password Strength Indicator
// ---------------------------------------------------------------------------

function getPasswordStrength(password: string) {
  let score = 0
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }

  Object.values(checks).forEach((v) => { if (v) score++ })

  if (score <= 2) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/3', textColor: 'text-red-500' }
  if (score <= 3) return { label: 'Fair', color: 'bg-amber-500', width: 'w-2/3', textColor: 'text-amber-500' }
  return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full', textColor: 'text-emerald-500' }
}

// ---------------------------------------------------------------------------
// Register Page
// ---------------------------------------------------------------------------

export function RegisterPage() {
  const { setRoute, isAuthenticated } = useRouterStore()
  const { register, isRegistering } = useAuth()
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [termsAccepted, setTermsAccepted] = React.useState(false)
  const [termsError, setTermsError] = React.useState('')

  const form = useForm<RegisterInput & { confirmPassword: string }>({
    resolver: zodResolver(
      registerSchema.extend({
        confirmPassword: z.string().min(1, 'Please confirm your password'),
      }).refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      })
    ),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  // Navigate to dashboard once authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      setRoute(AppRoute.DASHBOARD)
    }
  }, [isAuthenticated, setRoute])

  function onSubmit(data: RegisterInput & { confirmPassword: string }) {
    if (!termsAccepted) {
      setTermsError('You must accept the terms and conditions')
      return
    }
    setTermsError('')
    const { confirmPassword: _, ...registerData } = data
    register(registerData)
  }

  const watchedPassword = form.watch('password')
  const strength = getPasswordStrength(watchedPassword || '')

  const passwordChecks = [
    { label: 'At least 8 characters', met: (watchedPassword || '').length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(watchedPassword || '') },
    { label: 'One lowercase letter', met: /[a-z]/.test(watchedPassword || '') },
    { label: 'One number', met: /[0-9]/.test(watchedPassword || '') },
  ]

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <Card className="rounded-2xl border-border/40 p-8 shadow-xl">
          <CardHeader className="items-center gap-3 text-center pb-2">
            {/* Logo with glow effect */}
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-primary/20 blur-xl" />
              <div className="relative flex size-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
                <Wallet className="size-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
            <CardDescription className="text-muted-foreground">
              Get started with FinWise in seconds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          autoComplete="name"
                          className="h-12 rounded-xl bg-muted/50 border-border/50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          className="h-12 rounded-xl bg-muted/50 border-border/50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create a password"
                            autoComplete="new-password"
                            className="h-12 rounded-xl bg-muted/50 border-border/50 pr-10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20"
                            {...field}
                          />
                          <motion.button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-200 hover:text-foreground"
                            tabIndex={-1}
                            whileTap={{ scale: 0.9 }}
                          >
                            {showPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </motion.button>
                        </div>
                      </FormControl>
                      <FormMessage />

                      {/* Password strength indicator with animated gradient bar */}
                      <AnimatePresence>
                        {watchedPassword && watchedPassword.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="mt-3 space-y-2 overflow-hidden"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                <motion.div
                                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                                    strength.width === 'w-1/3'
                                      ? 'bg-gradient-to-r from-red-500 to-red-400'
                                      : strength.width === 'w-2/3'
                                        ? 'bg-gradient-to-r from-red-500 via-amber-500 to-amber-400'
                                        : 'bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500'
                                  } ${strength.width}`}
                                  layout
                                />
                              </div>
                              <motion.span
                                className={`text-xs font-medium ${strength.textColor}`}
                                key={strength.label}
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                {strength.label}
                              </motion.span>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              {passwordChecks.map((check) => (
                                <motion.div
                                  key={check.label}
                                  className="flex items-center gap-1.5"
                                  initial={false}
                                  animate={{ opacity: 1 }}
                                >
                                  <motion.div
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: check.met ? 1.15 : 0.5 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    className="flex size-3.5 items-center justify-center"
                                  >
                                    {check.met ? (
                                      <Check className="size-3.5 text-emerald-500" />
                                    ) : (
                                      <X className="size-3 text-muted-foreground/30" />
                                    )}
                                  </motion.div>
                                  <span className={`text-[11px] transition-colors duration-300 ${check.met ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                                    {check.label}
                                  </span>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            autoComplete="new-password"
                            className="h-12 rounded-xl bg-muted/50 border-border/50 pr-10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20"
                            {...field}
                          />
                          <motion.button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-200 hover:text-foreground"
                            tabIndex={-1}
                            whileTap={{ scale: 0.9 }}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </motion.button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Terms checkbox with subtle animation */}
                <div className="grid gap-1.5">
                  <motion.div
                    className="flex items-start gap-2.5"
                    whileTap={{ scale: 0.995 }}
                  >
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => {
                        setTermsAccepted(checked === true)
                        if (checked) setTermsError('')
                      }}
                      className="mt-0.5 size-4 transition-all duration-200"
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm leading-snug text-muted-foreground"
                    >
                      I agree to the{' '}
                      <span className="cursor-pointer font-medium text-foreground transition-colors hover:text-primary hover:underline">
                        Terms of Service
                      </span>{' '}
                      and{' '}
                      <span className="cursor-pointer font-medium text-foreground transition-colors hover:text-primary hover:underline">
                        Privacy Policy
                      </span>
                    </label>
                  </motion.div>
                  <AnimatePresence>
                    {termsError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="text-sm text-destructive"
                      >
                        {termsError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl text-base shadow-lg shadow-primary/20"
                  size="lg"
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create account'
                  )}
                </Button>

                {/* Refined divider */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/40" />
                  </div>
                  <span className="relative bg-card px-4 text-xs text-muted-foreground/60">
                    or
                  </span>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setRoute('/login')}
                    className="group relative font-medium text-primary transition-colors duration-200 hover:text-primary/80"
                  >
                    Sign in
                    <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary/50 transition-all duration-300 group-hover:w-full" />
                  </button>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </AuthLayout>
  )
}

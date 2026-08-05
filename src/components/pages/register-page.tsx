'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Wallet, Loader2, Check, X } from 'lucide-react'
import { useRouterStore } from '@/store/router-store'
import { useAuth } from '@/hooks/use-auth'
import { registerSchema } from '@/lib/validators'
import type { RegisterInput } from '@/types'
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

  if (score <= 2) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/3' }
  if (score <= 3) return { label: 'Fair', color: 'bg-amber-500', width: 'w-2/3' }
  return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' }
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
      setRoute('/dashboard')
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
      <Card className="border-border/50 shadow-xl">
        <CardHeader className="items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary">
            <Wallet className="size-5 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Get started with FinWise in seconds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        autoComplete="name"
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a password"
                          autoComplete="new-password"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />

                    {/* Password strength indicator */}
                    {watchedPassword && watchedPassword.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{strength.label}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {passwordChecks.map((check) => (
                            <div key={check.label} className="flex items-center gap-1.5">
                              {check.met ? (
                                <Check className="size-3 text-emerald-500" />
                              ) : (
                                <X className="size-3 text-muted-foreground/40" />
                              )}
                              <span className="text-[11px] text-muted-foreground">{check.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          autoComplete="new-password"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Terms checkbox */}
              <div className="grid gap-1.5">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => {
                      setTermsAccepted(checked === true)
                      if (checked) setTermsError('')
                    }}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm leading-snug text-muted-foreground"
                  >
                    I agree to the{' '}
                    <span className="font-medium text-foreground hover:underline cursor-pointer">
                      Terms of Service
                    </span>{' '}
                    and{' '}
                    <span className="font-medium text-foreground hover:underline cursor-pointer">
                      Privacy Policy
                    </span>
                  </label>
                </div>
                {termsError && (
                  <p className="text-sm text-destructive">{termsError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
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

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <span className="relative bg-card px-3 text-xs text-muted-foreground">
                  or
                </span>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setRoute('/login')}
                  className="font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Sign in
                </button>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Wallet, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouterStore } from '@/store/router-store'
import { useAuth } from '@/hooks/use-auth'
import { loginSchema } from '@/lib/validators'
import type { LoginInput } from '@/types'
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

export function LoginPage() {
  const { setRoute, isAuthenticated } = useRouterStore()
  const { login, isLoggingIn } = useAuth()
  const [showPassword, setShowPassword] = React.useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  // Navigate to dashboard once authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      setRoute(AppRoute.DASHBOARD)
    }
  }, [isAuthenticated, setRoute])

  function onSubmit(data: LoginInput) {
    login(data)
  }

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
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
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
                            placeholder="Enter your password"
                            autoComplete="current-password"
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
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="size-4"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal text-muted-foreground">
                        Remember me for 7 days
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl text-base shadow-lg shadow-primary/20"
                  size="lg"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setRoute('/forgot-password')}
                    className="group relative text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
                  >
                    Forgot password?
                    <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
                  </button>
                </div>

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
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setRoute('/register')}
                    className="group relative font-medium text-primary transition-colors duration-200 hover:text-primary/80"
                  >
                    Sign up
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

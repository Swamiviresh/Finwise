'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouterStore } from '@/store/router-store'
import { useAuth } from '@/hooks/use-auth'
import { forgotPasswordSchema } from '@/lib/validators'
import type { ForgotPasswordInput } from '@/types'
import { AuthLayout } from '@/components/pages/auth-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

export function ForgotPasswordPage() {
  const { setRoute } = useRouterStore()
  const { forgotPassword, isSendingReset } = useAuth()
  const [submitted, setSubmitted] = React.useState(false)
  const [submittedEmail, setSubmittedEmail] = React.useState('')

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  function onSubmit(data: ForgotPasswordInput) {
    setSubmittedEmail(data.email)
    forgotPassword(data, {
      onSuccess: () => {
        setSubmitted(true)
      },
    })
  }

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <Card className="rounded-2xl border-border/40 p-8 shadow-xl">
              <CardHeader className="items-center gap-3 text-center pb-2">
                {/* Lock icon with floating animation */}
                <div className="relative">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative flex size-12 items-center justify-center rounded-xl bg-primary/10"
                  >
                    <Lock className="size-6 text-primary" />
                  </motion.div>
                </div>
                <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter your email address and we&apos;ll send you a link to reset
                  your password.
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

                    <Button
                      type="submit"
                      className="h-12 w-full rounded-xl text-base shadow-lg shadow-primary/20"
                      size="lg"
                      disabled={isSendingReset}
                    >
                      {isSendingReset ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Sending reset link...
                        </>
                      ) : (
                        'Send reset link'
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setRoute('/login')}
                      className="group mx-auto flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                    >
                      <ArrowLeft className="size-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                      Back to login
                    </button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <Card className="rounded-2xl border-border/40 p-8 shadow-xl">
              <CardHeader className="items-center gap-3 text-center pb-2">
                {/* Animated checkmark with confetti-like scale bounce */}
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                    className="relative flex size-16 items-center justify-center rounded-full bg-emerald-500/10"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 250, damping: 15, delay: 0.25 }}
                    >
                      <CheckCircle2 className="size-8 text-emerald-500" />
                    </motion.div>
                    {/* Ripple effect */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: 1.6, opacity: 0 }}
                      transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-full border-2 border-emerald-500/20"
                    />
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0.3 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-full border border-emerald-500/10"
                    />
                  </motion.div>
                </div>
                <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                <CardDescription className="max-w-xs text-muted-foreground">
                  We&apos;ve sent a password reset link to{' '}
                  <span className="font-medium text-foreground">{submittedEmail}</span>.
                  Please check your inbox and follow the instructions.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-xl text-base"
                  size="lg"
                  onClick={() => setRoute('/login')}
                >
                  <ArrowLeft className="mr-1.5 size-4" />
                  Back to login
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false)
                    form.reset()
                  }}
                  className="group mx-auto text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  Didn&apos;t receive the email?{' '}
                  <span className="font-medium text-primary transition-colors hover:text-primary/80">
                    Try again
                  </span>
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}

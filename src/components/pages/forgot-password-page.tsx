'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
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
import { motion, AnimatePresence } from 'framer-motion'

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
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="border-border/50 shadow-xl">
              <CardHeader className="items-center gap-2 text-center">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
                  <Lock className="size-5 text-primary" />
                </div>
                <CardTitle className="text-xl">Reset your password</CardTitle>
                <CardDescription>
                  Enter your email address and we&apos;ll send you a link to reset
                  your password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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

                    <Button
                      type="submit"
                      className="w-full"
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
                      className="mx-auto flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <ArrowLeft className="size-3.5" />
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="border-border/50 shadow-xl">
              <CardHeader className="items-center gap-2 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10"
                >
                  <CheckCircle2 className="size-7 text-emerald-500" />
                </motion.div>
                <CardTitle className="text-xl">Check your email</CardTitle>
                <CardDescription className="max-w-xs">
                  We&apos;ve sent a password reset link to{' '}
                  <span className="font-medium text-foreground">{submittedEmail}</span>.
                  Please check your inbox and follow the instructions.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Button
                  variant="outline"
                  className="w-full"
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
                  className="mx-auto text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Didn&apos;t receive the email? Try again
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}

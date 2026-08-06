'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Info } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm?: () => void
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-border/40 p-0 gap-0 overflow-hidden backdrop-blur-xl max-w-[420px]">
        <AlertDialogHeader className="p-6 pb-0">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl',
                variant === 'destructive'
                  ? 'bg-destructive/10'
                  : 'bg-primary/10',
              )}
            >
              {variant === 'destructive' ? (
                <AlertTriangle className="size-5 text-destructive" />
              ) : (
                <Info className="size-5 text-primary" />
              )}
            </div>
            <div className="space-y-1.5 pt-0.5">
              <AlertDialogTitle className="text-base font-semibold">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground/80">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2 border-t/40 bg-muted/20 p-4 sm:justify-end">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <AlertDialogCancel
              disabled={loading}
              className="rounded-xl border-border/60 text-sm transition-colors duration-150"
            >
              {cancelLabel}
            </AlertDialogCancel>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                onConfirm?.()
              }}
              disabled={loading}
              className={cn(
                'rounded-xl text-sm font-medium transition-all duration-200',
                variant === 'destructive' &&
                  cn(
                    buttonVariants({ variant: 'destructive' }),
                    'shadow-sm shadow-destructive/20 hover:shadow-md hover:shadow-destructive/30',
                  ),
                variant !== 'destructive' &&
                  'shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30',
              )}
            >
              {loading ? 'Loading...' : confirmLabel}
            </AlertDialogAction>
          </motion.div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

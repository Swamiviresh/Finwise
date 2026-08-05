'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { LandingHeader } from '@/components/layout/landing-header'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Animated gradient mesh background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] animate-pulse rounded-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] animate-pulse rounded-full bg-gradient-to-tl from-primary/15 via-primary/5 to-transparent blur-3xl [animation-delay:2s]" />
        <div className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 animate-pulse rounded-full bg-gradient-to-r from-primary/10 to-transparent blur-3xl [animation-delay:4s]" />
      </div>

      <LandingHeader />

      <main className="flex min-h-screen flex-col items-center justify-center px-4 pt-16 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}

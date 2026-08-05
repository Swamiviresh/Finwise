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
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -25, 15, 0],
            scale: [1, 1.05, 0.95, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/15 via-primary/5 to-transparent blur-[100px]"
        />
        <motion.div
          animate={{
            x: [0, -25, 20, 0],
            y: [0, 20, -30, 0],
            scale: [1, 0.95, 1.05, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-primary/10 via-primary/3 to-transparent blur-[100px]"
        />
        <motion.div
          animate={{
            x: [0, 15, -15, 0],
            y: [0, -15, 10, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/8 to-transparent blur-[100px]"
        />
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <LandingHeader />

      <main className="flex min-h-screen flex-col items-center justify-center px-4 pt-16 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}

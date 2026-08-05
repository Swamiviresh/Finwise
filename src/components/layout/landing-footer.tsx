'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Wallet, Github, Twitter, Linkedin, Youtube } from 'lucide-react'
import { APP_CONFIG } from '@/lib/constants'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const PRODUCT_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Integrations', href: '#' },
  { label: 'Changelog', href: '#' },
  { label: 'Roadmap', href: '#' },
]

const COMPANY_LINKS = [
  { label: 'About', href: '#' },
  { label: 'Blog', href: '#' },
  { label: 'Careers', href: '#' },
  { label: 'Press', href: '#' },
  { label: 'Contact', href: '#' },
]

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Cookie Policy', href: '#' },
  { label: 'GDPR', href: '#' },
]

const SOCIAL_LINKS = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Youtube, href: '#', label: 'YouTube' },
]

export function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t/40 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/15">
                <Wallet className="size-[18px] text-primary-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight">FinWise</span>
            </div>
            <p className="mt-5 max-w-[260px] text-[13px] leading-relaxed text-muted-foreground/80">
              {APP_CONFIG.APP_DESCRIPTION}. Take control of your money with
              intelligent budgeting, real-time analytics, and AI-powered
              insights.
            </p>
            {/* Social icons */}
            <div className="mt-6 flex items-center gap-2">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    whileHover={{ scale: 1.12, y: -2 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-xl',
                      'text-muted-foreground/60 transition-colors duration-200',
                      'hover:bg-accent/80 hover:text-foreground',
                    )}
                  >
                    <Icon className="size-4" />
                  </motion.a>
                )
              })}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Product
            </h3>
            <ul className="mt-5 space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[13px] text-muted-foreground/80 transition-colors duration-150 hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Company
            </h3>
            <ul className="mt-5 space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[13px] text-muted-foreground/80 transition-colors duration-150 hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Legal
            </h3>
            <ul className="mt-5 space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[13px] text-muted-foreground/80 transition-colors duration-150 hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-10 opacity-40" />

        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs font-medium text-muted-foreground/50">
            &copy; {currentYear} {APP_CONFIG.APP_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/40">
            Built with care for your financial well-being.
          </p>
        </div>
      </div>
    </footer>
  )
}

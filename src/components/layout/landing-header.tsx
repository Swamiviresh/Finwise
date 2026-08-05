'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Menu, X } from 'lucide-react'
import { useRouterStore } from '@/store/router-store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export function LandingHeader() {
  const { setRoute } = useRouterStore()
  const [scrolled, setScrolled] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out',
        scrolled
          ? 'border-b/40 bg-background/70 shadow-lg shadow-black/[0.03] backdrop-blur-2xl'
          : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
            <Wallet className="size-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">FinWise</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              {link.label}
              <span className="absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 rounded-full bg-primary transition-all duration-300 ease-out group-hover:w-5" />
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="ghost"
            onClick={() => setRoute('/login')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Login
          </Button>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Button
              onClick={() => setRoute('/register')}
              className="relative overflow-hidden rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
            >
              <span className="relative z-10">Sign Up</span>
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </Button>
          </motion.div>
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden border-t/40 bg-background/95 backdrop-blur-2xl md:hidden"
          >
            <nav className="flex flex-col gap-1 p-4">
              {NAV_LINKS.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent/50 hover:text-foreground"
                >
                  {link.label}
                </motion.a>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t/40 pt-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMobileOpen(false)
                    setRoute('/login')
                  }}
                  className="rounded-xl"
                >
                  Login
                </Button>
                <Button
                  onClick={() => {
                    setMobileOpen(false)
                    setRoute('/register')
                  }}
                  className="rounded-xl"
                >
                  Sign Up
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

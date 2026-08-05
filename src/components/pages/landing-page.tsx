'use client'

import * as React from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Brain,
  Target,
  CreditCard,
  BarChart3,
  MessageSquare,
  PiggyBank,
  ArrowRight,
  Check,
  Play,
  Star,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
} from 'lucide-react'
import { useRouterStore } from '@/store/router-store'
import { LandingHeader } from '@/components/layout/landing-header'
import { LandingFooter } from '@/components/layout/landing-footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------

const easeOut = [0.21, 0.47, 0.32, 0.98]

function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = React.useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, delay, ease: easeOut }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function StaggerContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = React.useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.1 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Hero Section
// ---------------------------------------------------------------------------

function HeroSection() {
  const { setRoute } = useRouterStore()

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
      {/* Animated mesh gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(0,0,0,0))]" />
        {/* Animated grid */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.03] dark:opacity-[0.06]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* Floating orbs */}
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[15%] top-[20%] h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 15, 0], x: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute right-[10%] top-[30%] h-96 w-96 rounded-full bg-primary/5 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-[20%] left-[40%] h-64 w-64 rounded-full bg-primary/8 blur-3xl"
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: easeOut }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1">
                <Sparkles className="size-3.5" />
                Powered by AI
              </Badge>
            </motion.div>
            <h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl">
              Your AI Powered{' '}
              <span className="gradient-text">
                Personal Finance
              </span>{' '}
              Companion
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:mx-0">
              Take control of your money with intelligent budgeting, real-time
              analytics, and AI-powered insights. FinWise makes managing your
              finances effortless and rewarding.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="h-12 rounded-xl px-8 text-base shadow-lg shadow-primary/20"
                  onClick={() => setRoute('/register')}
                >
                  Get Started Free
                  <ArrowRight className="ml-1 size-4" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" size="lg" className="h-12 rounded-xl border-white/10 bg-white/5 px-8 text-base backdrop-blur-sm">
                  <Play className="mr-1 size-4" />
                  Watch Demo
                </Button>
              </motion.div>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground lg:justify-start">
              <div className="flex items-center gap-1.5">
                <Check className="size-4 text-primary" />
                Free forever plan
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="size-4 text-primary" />
                No credit card
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="size-4 text-primary" />
                Bank-level security
              </div>
            </div>
          </motion.div>

          {/* Right: Floating Glass Card Mockups */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: easeOut }}
            className="relative hidden lg:block"
          >
            <div className="relative h-[520px]">
              {/* Main dashboard card */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="glass absolute right-0 top-4 w-[360px] rounded-2xl p-6 shadow-2xl animate-float"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold">Total Balance</span>
                  <Badge variant="secondary" className="text-xs">This Month</Badge>
                </div>
                <div className="mb-1 text-3xl font-bold tracking-tight">$24,563.00</div>
                <div className="mb-5 flex items-center gap-1 text-sm text-emerald-500">
                  <TrendingUp className="size-4" />
                  +12.5% from last month
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Income', value: '$8,240', color: 'bg-emerald-500' },
                    { label: 'Expenses', value: '$3,120', color: 'bg-rose-500' },
                    { label: 'Savings', value: '$5,120', color: 'bg-primary' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-muted/50 p-2.5">
                      <div className={`mb-1.5 h-1 w-8 rounded-full ${item.color}`} />
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                      <div className="text-sm font-semibold">{item.value}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Floating AI card */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="glass absolute left-0 top-16 w-[240px] rounded-2xl p-4 shadow-xl animate-float [animation-delay:1s]"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                    <Brain className="size-4 text-primary" />
                  </div>
                  <span className="text-xs font-semibold">AI Insight</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  You could save <span className="font-semibold text-foreground">$340/mo</span> by
                  consolidating your subscriptions.
                </p>
              </motion.div>

              {/* Floating goal card */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="glass absolute bottom-12 left-8 w-[210px] rounded-2xl p-4 shadow-xl animate-float [animation-delay:2s]"
              >
                <div className="mb-2 text-xs font-semibold">Vacation Fund</div>
                <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[72%] rounded-full bg-primary" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$3,600</span>
                  <span>$5,000</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Brands / Social Proof Section
// ---------------------------------------------------------------------------

function BrandsSection() {
  const ref = React.useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const brands = ['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Stark Industries', 'Wayne Enterprises']
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="border-y bg-muted/30 py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-10 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground/60">
          Trusted by forward-thinking teams
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {brands.map((brand) => (
            <span
              key={brand}
              className="text-lg font-bold tracking-tight text-muted-foreground/40 transition-colors duration-300 hover:text-muted-foreground/70"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  )
}

// ---------------------------------------------------------------------------
// Features Section
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: Brain,
    title: 'Smart Budgeting',
    description:
      'AI-powered budget recommendations that learn from your spending habits and help you save more every month.',
    gradient: 'from-violet-500/10 to-purple-500/10',
    iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  {
    icon: CreditCard,
    title: 'Expense Tracking',
    description:
      'Automatic categorization and deep insights into your spending patterns. Know exactly where your money goes.',
    gradient: 'from-rose-500/10 to-pink-500/10',
    iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  },
  {
    icon: Target,
    title: 'Financial Goals',
    description:
      'Set and track savings goals with visual progress indicators and smart milestones to keep you motivated.',
    gradient: 'from-amber-500/10 to-orange-500/10',
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    icon: Zap,
    title: 'Subscription Management',
    description:
      'Track and manage all your recurring payments in one place. Never get surprised by a forgotten subscription again.',
    gradient: 'from-cyan-500/10 to-teal-500/10',
    iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  },
  {
    icon: MessageSquare,
    title: 'AI Assistant',
    description:
      'Get personalized financial advice from our AI assistant. Ask questions about your spending, savings, and investments.',
    gradient: 'from-emerald-500/10 to-green-500/10',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description:
      'Professional-grade financial reports with interactive charts, trends, and actionable insights for smarter decisions.',
    gradient: 'from-primary/10 to-primary/5',
    iconBg: 'bg-primary/10 text-primary',
  },
]

function FeaturesSection() {
  return (
    <section id="features" className="py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">Features</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to manage your finances
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful tools designed to give you complete control over your financial life.
          </p>
        </FadeIn>

        <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <StaggerItem key={feature.title}>
                <Card className="premium-card group relative h-full overflow-hidden rounded-2xl border-transparent">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                  <CardContent className="relative p-8">
                    <div className={`mb-5 flex size-10 items-center justify-center rounded-xl ${feature.iconBg}`}>
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                    <p className="leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Screenshots / Dashboard Preview Section
// ---------------------------------------------------------------------------

function ScreenshotSection() {
  return (
    <section className="bg-muted/30 py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">Dashboard Preview</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            A beautiful dashboard that makes sense of your money
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Clean, intuitive, and packed with the insights you need at a glance.
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="mx-auto max-w-5xl"
          >
            {/* Browser chrome */}
            <div className="glass overflow-hidden rounded-2xl shadow-2xl">
              {/* Title bar */}
              <div className="flex items-center gap-2 border-b bg-muted/50 px-5 py-3">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-red-400" />
                  <div className="size-3 rounded-full bg-yellow-400" />
                  <div className="size-3 rounded-full bg-green-400" />
                </div>
                <div className="mx-auto flex h-7 w-72 items-center justify-center rounded-lg bg-background text-xs text-muted-foreground shadow-sm">
                  app.finwise.com/dashboard
                </div>
              </div>

              {/* Dashboard content mockup */}
              <div className="grid grid-cols-12 gap-0">
                {/* Sidebar mockup */}
                <div className="col-span-3 hidden border-r bg-muted/30 p-4 md:block">
                  <div className="mb-6 flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                      <PiggyBank className="size-4 text-primary-foreground" />
                    </div>
                    <span className="text-sm font-bold">FinWise</span>
                  </div>
                  <div className="space-y-1">
                    {['Dashboard', 'Transactions', 'Budgets', 'Goals', 'Analytics', 'Settings'].map((item, i) => (
                      <div
                        key={item}
                        className={`rounded-lg px-3 py-2 text-xs transition-colors ${
                          i === 0 ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main content mockup */}
                <div className="col-span-12 p-4 md:col-span-9 md:p-6">
                  {/* Summary cards */}
                  <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: 'Total Balance', value: '$24,563', change: '+12.5%', positive: true },
                      { label: 'Monthly Income', value: '$8,240', change: '+4.2%', positive: true },
                      { label: 'Monthly Expenses', value: '$3,120', change: '-8.1%', positive: true },
                      { label: 'Savings Rate', value: '62%', change: '+5.3%', positive: true },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border bg-card p-3">
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                        <div className="mt-1 text-lg font-bold">{stat.value}</div>
                        <div className={`text-xs ${stat.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {stat.change}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chart area */}
                  <div className="mb-6 rounded-xl border bg-card p-4">
                    <div className="mb-3 text-sm font-semibold">Income vs Expenses</div>
                    <div className="flex h-32 items-end gap-2">
                      {[40, 65, 45, 70, 55, 80, 60, 75, 85, 65, 90, 70].map((h, i) => (
                        <div key={i} className="flex flex-1 flex-col items-center gap-1">
                          <div className="flex w-full gap-0.5" style={{ height: `${h}%` }}>
                            <div className="flex-1 rounded-t bg-primary/80" />
                            <div className="flex-1 rounded-t bg-rose-400/60" />
                          </div>
                          <div className="text-[9px] text-muted-foreground">
                            {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent transactions */}
                  <div className="rounded-xl border bg-card p-4">
                    <div className="mb-3 text-sm font-semibold">Recent Transactions</div>
                    <div className="space-y-2.5">
                      {[
                        { name: 'Spotify Premium', category: 'Subscriptions', amount: '-$9.99', color: 'bg-rose-400' },
                        { name: 'Salary Deposit', category: 'Income', amount: '+$4,120', color: 'bg-emerald-400' },
                        { name: 'Grocery Store', category: 'Food & Dining', amount: '-$84.30', color: 'bg-rose-400' },
                        { name: 'Freelance Project', category: 'Income', amount: '+$2,000', color: 'bg-emerald-400' },
                      ].map((tx) => (
                        <div key={tx.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`size-8 rounded-full ${tx.color}/20 flex items-center justify-center`}>
                              <div className={`size-2 rounded-full ${tx.color}`} />
                            </div>
                            <div>
                              <div className="text-xs font-medium">{tx.name}</div>
                              <div className="text-[10px] text-muted-foreground">{tx.category}</div>
                            </div>
                          </div>
                          <div className={`text-xs font-semibold ${tx.color === 'bg-emerald-400' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {tx.amount}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </FadeIn>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Testimonials Section
// ---------------------------------------------------------------------------

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Product Designer at Figma',
    avatar: 'SC',
    quote:
      'FinWise completely transformed how I think about money. The AI insights helped me find $300/month in savings I didn\'t know I had. It\'s like having a financial advisor in my pocket.',
    rating: 5,
  },
  {
    name: 'Marcus Johnson',
    role: 'Freelance Developer',
    avatar: 'MJ',
    quote:
      'As a freelancer, tracking finances was always chaotic. FinWise made it simple. The budget tracking and goal features keep me on target every month. Highly recommend!',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Marketing Director',
    avatar: 'ER',
    quote:
      'The subscription tracking alone saved me from renewing services I never used. The dashboard is beautiful and the analytics are incredibly insightful. Best finance app I\'ve used.',
    rating: 5,
  },
]

function TestimonialsSection() {
  return (
    <section className="py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">Testimonials</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Loved by thousands of users
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Don&apos;t just take our word for it. Here&apos;s what our users have to say.
          </p>
        </FadeIn>

        <StaggerContainer className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <StaggerItem key={t.name}>
              <Card className="glass premium-card h-full rounded-2xl">
                <CardContent className="p-6">
                  <div className="mb-4 flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="mb-6 text-sm leading-relaxed italic text-muted-foreground">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Pricing Section
// ---------------------------------------------------------------------------

const PRICING_TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started with personal finance.',
    features: [
      'Up to 50 transactions/month',
      'Basic expense tracking',
      '1 budget',
      '1 financial goal',
      'Basic analytics',
      'Community support',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    description: 'For individuals who want full control of their finances.',
    features: [
      'Unlimited transactions',
      'AI-powered categorization',
      'Unlimited budgets & goals',
      'Subscription management',
      'Advanced analytics & reports',
      'AI financial assistant',
      'Priority email support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Business',
    price: '$24.99',
    period: '/month',
    description: 'For professionals and small businesses.',
    features: [
      'Everything in Pro',
      'Multi-account management',
      'Team collaboration',
      'Custom financial reports',
      'API access',
      'White-label exports',
      'Dedicated account manager',
      '24/7 phone support',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

function PricingSection() {
  const { setRoute } = useRouterStore()

  return (
    <section id="pricing" className="bg-muted/30 py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">Pricing</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that&apos;s right for you. Upgrade or downgrade anytime.
          </p>
        </FadeIn>

        <StaggerContainer className="mx-auto grid max-w-5xl items-center gap-6 md:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <StaggerItem key={tier.name}>
              <Card
                className={`premium-card relative h-full rounded-2xl transition-shadow duration-300 ${
                  tier.highlighted
                    ? 'scale-105 border-primary shadow-xl shadow-primary/10'
                    : ''
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="px-3 py-1 shadow-sm">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-0">
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-6">
                  <div>
                    <span className="text-4xl font-bold tracking-tight">{tier.price}</span>
                    <span className="text-sm text-muted-foreground">{tier.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                  <ul className="flex-1 space-y-2.5">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      className="w-full rounded-xl"
                      variant={tier.highlighted ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => setRoute('/register')}
                    >
                      {tier.cta}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// FAQ Section
// ---------------------------------------------------------------------------

const FAQ_ITEMS = [
  {
    q: 'Is FinWise free to use?',
    a: 'Yes! FinWise offers a generous free plan with up to 50 transactions per month, basic expense tracking, and one budget. You can upgrade to Pro or Business anytime for unlimited features and AI-powered insights.',
  },
  {
    q: 'How secure is my financial data?',
    a: 'We take security extremely seriously. All data is encrypted at rest and in transit using AES-256 encryption. We never store your banking credentials and use bank-level security protocols. We are SOC 2 Type II compliant.',
  },
  {
    q: 'Can I connect my bank accounts?',
    a: 'Yes, FinWise supports secure bank connections through Plaid. You can link over 12,000 financial institutions across the US, Canada, and Europe. Connections are read-only and your credentials are never stored on our servers.',
  },
  {
    q: 'What does the AI assistant do?',
    a: 'Our AI assistant analyzes your spending patterns to provide personalized financial advice, identify savings opportunities, predict future spending, suggest optimal budget allocations, and answer any questions about your finances in natural language.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Absolutely. There are no long-term contracts or cancellation fees. You can cancel your Pro or Business subscription at any time from your account settings. You\'ll continue to have access until the end of your billing period.',
  },
  {
    q: 'Do you offer team or family plans?',
    a: 'Yes, our Business plan supports team collaboration with shared budgets and reports. We\'re also working on a Family plan that will allow multiple household members to track shared expenses and goals together. Stay tuned!',
  },
]

function FAQSection() {
  return (
    <section id="faq" className="py-28 sm:py-36">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto mb-16 text-center">
          <Badge variant="secondary" className="mb-4">FAQ</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about FinWise.
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border/50">
                <AccordionTrigger className="text-left text-sm font-medium sm:text-base">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Final CTA Section
// ---------------------------------------------------------------------------

function CTASection() {
  const { setRoute } = useRouterStore()

  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,119,198,0.1),transparent_70%)]" />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <FadeIn>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Ready to take control of your finances?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Join thousands of users who have already transformed their financial lives with FinWise.
            Start for free, no credit card required.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                className="h-12 rounded-xl px-8 text-base shadow-lg shadow-primary/20"
                onClick={() => setRoute('/register')}
              >
                Get Started Free
                <ArrowRight className="ml-1 size-4" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" size="lg" className="h-12 rounded-xl border-white/10 bg-white/5 px-8 text-base backdrop-blur-sm">
                Schedule a Demo
              </Button>
            </motion.div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Main Landing Page
// ---------------------------------------------------------------------------

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <HeroSection />
      <BrandsSection />
      <FeaturesSection />
      <ScreenshotSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <LandingFooter />
    </div>
  )
}

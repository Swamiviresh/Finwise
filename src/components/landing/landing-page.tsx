'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  Shield, Brain, Target, TrendingUp, Lock, BarChart3,
  ArrowRight, Check, Star, Zap, Eye, Sparkles, ChevronRight, Wallet, PieChart, Bot, Globe
} from 'lucide-react'

const NAV_ITEMS = ['Features', 'Security', 'Pricing']

const FEATURES = [
  { icon: BarChart3, title: 'Smart Analytics', desc: 'Visualize your spending patterns with AI-powered insights. Understand exactly where your money goes every month.', color: '#10b981' },
  { icon: Brain, title: 'AI Finance Coach', desc: 'Ask natural language questions about your finances. Get personalized advice based on your actual spending data.', color: '#06b6d4' },
  { icon: Target, title: 'Budget Planner', desc: 'Create intelligent budgets with real-time tracking. Get warned before you overspend on any category.', color: '#f59e0b' },
  { icon: TrendingUp, title: 'Goal Tracker', desc: 'Set savings goals and watch your progress. Get estimated completion dates and smart savings suggestions.', color: '#8b5cf6' },
  { icon: Lock, title: 'Secure & Private', desc: 'Bank-level encryption with zero data retention. Your documents are processed and immediately deleted.', color: '#10b981' },
  { icon: Sparkles, title: 'Smart Reports', desc: 'Generate detailed weekly, monthly, and annual reports. Export as PDF or CSV for your records.', color: '#06b6d4' },
]

const SECURITY_FEATURES = [
  { icon: Shield, title: 'End-to-End Encryption', desc: 'All your financial data is encrypted in transit and at rest using AES-256 encryption.' },
  { icon: Eye, title: 'Zero Data Retention', desc: 'Uploaded documents are permanently deleted after processing. No copies, no backups.' },
  { icon: Lock, title: 'No Bank Access Needed', desc: 'We never ask for your banking credentials. Upload statements manually for complete control.' },
  { icon: Brain, title: 'AI Privacy Guarantees', desc: 'AI only sees anonymized summaries. Raw data never reaches any model. Not used for training.' },
]

const TESTIMONIALS = [
  { name: 'Sarah Chen', role: 'Software Engineer', text: 'FinWise AI helped me identify $200/month in unused subscriptions I didn\'t know I had. The AI coach is incredibly insightful.', rating: 5 },
  { name: 'Marcus Johnson', role: 'Freelance Designer', text: 'As a freelancer, tracking finances was chaotic. FinWise gave me clarity and helped me build a 6-month emergency fund.', rating: 5 },
  { name: 'Priya Sharma', role: 'Graduate Student', text: 'The budget planner and goal tracker kept me on track during my studies. I actually saved money while in college!', rating: 5 },
]

const PRICING = [
  {
    name: 'Free', price: '$0', period: 'forever',
    features: ['Track up to 50 transactions/month', 'Basic analytics', '2 budget categories', '1 savings goal', 'Weekly reports'],
    cta: 'Get Started', highlighted: false
  },
  {
    name: 'Pro', price: '$9.99', period: '/month',
    features: ['Unlimited transactions', 'AI Finance Coach', 'Unlimited budgets & goals', 'All report types', 'Smart categorization', 'Export to PDF/CSV', 'Priority support'],
    cta: 'Start Free Trial', highlighted: true
  },
  {
    name: 'Enterprise', price: '$29.99', period: '/month',
    features: ['Everything in Pro', 'Family accounts (up to 5)', 'Advanced forecasting', 'API access', 'Custom categories', 'Dedicated support', 'Compliance reports'],
    cta: 'Contact Sales', highlighted: false
  },
]

const FAQS = [
  { q: 'Is my financial data secure?', a: 'Absolutely. We use AES-256 encryption, never store your banking credentials, and all uploaded documents are permanently deleted after processing. Your data is never used for AI model training.' },
  { q: 'Do I need to connect my bank account?', a: 'No. FinWise AI works with manually uploaded statements (CSV, PDF, Excel). You have complete control over what data you share and when.' },
  { q: 'How does the AI Finance Coach work?', a: 'The AI coach analyzes your anonymized financial summaries — never raw data. It provides personalized insights, spending recommendations, and answers your finance questions in natural language.' },
  { q: 'Can I delete all my data?', a: 'Yes. You can export all your data, delete chat history, remove uploaded documents, and permanently delete your account at any time from Settings.' },
  { q: 'What makes FinWise different from other budgeting apps?', a: 'Unlike most apps that just record expenses, FinWise AI provides intelligent insights, explains your spending habits, forecasts future expenses, and helps you actively improve your financial health.' },
]

function FadeInWhenVisible({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay, ease: 'easeOut' }} className={className}>
      {children}
    </motion.div>
  )
}

function FloatingParticles() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const particles = mounted ? Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1.5,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.25 + 0.05,
    color: ['#34d399', '#22d3ee', '#a78bfa', '#fbbf24'][Math.floor(Math.random() * 4)],
  })) : []
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, opacity: p.opacity, background: p.color }}
          animate={{ y: [0, -40, 0], x: [0, 20, 0], opacity: [p.opacity, p.opacity * 2.5, p.opacity] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

function AnimatedCounter({ target, prefix = '', suffix = '', duration = 2 }: { target: number; prefix?: string; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const end = target
    const step = end / (duration * 60)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [inView, target, duration])

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

export default function LandingPage() {
  const setView = useAppStore(s => s.setView)

  return (
    <div className="min-h-screen mesh-bg-enhanced text-foreground overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong" style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">FinWise <span className="gradient-text">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setView('login')} className="text-muted-foreground hover:text-foreground hover:bg-white/5">Sign In</Button>
            <Button size="sm" onClick={() => setView('register')} className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white border-0 shadow-lg shadow-emerald-500/20">
              Get Started <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/12 rounded-full filter blur-[120px] pointer-events-none orb-animated" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full filter blur-[100px] pointer-events-none orb-animated" style={{ animationDelay: '-7s' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-500/6 rounded-full filter blur-[150px] pointer-events-none" />
        <FloatingParticles />
        <div className="max-w-7xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-sm text-foreground/70 mb-6 border border-emerald-500/15">
              <Star className="w-4 h-4 text-emerald-400 fill-emerald-400" /> Trusted by 10,000+ users worldwide
            </div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Your <span className="gradient-text text-glow-emerald">AI-Powered</span><br />Finance Coach
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Understand, analyze, and improve your finances with intelligent AI insights. Maximum privacy, zero compromise.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" onClick={() => setView('register')} className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white border-0 text-base px-8 py-6 rounded-xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-shadow">
              Start Free <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="glass rounded-xl text-base px-8 py-6 hover:bg-white/5 border-white/10 text-foreground">
              Watch Demo
            </Button>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.5 }} className="relative max-w-5xl mx-auto">
            <div className="glass rounded-2xl p-1 glow-emerald">
              <div className="bg-background/80 rounded-xl p-6 md:p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Total Income', value: '$8,450', change: '+12.5%', up: true },
                    { label: 'Expenses', value: '$3,280', change: '-8.2%', up: false },
                    { label: 'Savings', value: '$5,170', change: '+23.1%', up: true },
                    { label: 'Health Score', value: '87/100', change: '+5', up: true },
                  ].map((item, i) => (
                    <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.1 }} className="glass rounded-xl p-4 text-left">
                      <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                      <p className="text-xl md:text-2xl font-bold">{item.value}</p>
                      <p className={`text-xs mt-1 ${item.up ? 'text-emerald-400' : 'text-rose-400'}`}>{item.change}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="h-40 md:h-56 glass rounded-xl flex items-end justify-around p-4 gap-2">
                  {[65, 45, 80, 55, 70, 40, 90, 60, 75, 50, 85, 65].map((h, i) => (
                    <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 1 + i * 0.05, duration: 0.5 }} className="flex-1 bg-gradient-to-t from-emerald-500/40 to-cyan-500/40 rounded-t-md min-w-[8px]" />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <FadeInWhenVisible className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to master your <span className="gradient-text">finances</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Powerful tools that work together to give you complete visibility and control over your money.</p>
          </FadeInWhenVisible>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {FEATURES.map((f, i) => (
              <FadeInWhenVisible key={f.title} delay={i * 0.1}>
                <Card className="glass card-hover border-0 h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${f.color}15` }}>
                      <f.icon className="w-6 h-6" style={{ color: f.color }} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-foreground/70 leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <FadeInWhenVisible className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-sm text-cyan-400 mb-4">
              <Zap className="w-4 h-4" /> Simple Workflow
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Get started in <span className="gradient-text">3 simple steps</span></h2>
          </FadeInWhenVisible>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
            {[
              { step: '01', icon: Wallet, title: 'Upload Your Data', desc: 'Import your bank statements (CSV, PDF, Excel) or manually add transactions. No bank credentials needed — you stay in full control.', color: '#10b981' },
              { step: '02', icon: Brain, title: 'AI Analyzes Everything', desc: 'Our AI automatically categorizes transactions, identifies patterns, detects subscriptions, and generates a personalized financial health score.', color: '#06b6d4' },
              { step: '03', icon: Target, title: 'Get Actionable Insights', desc: 'Receive smart recommendations to save more, reduce unnecessary spending, and reach your financial goals faster.', color: '#f59e0b' },
            ].map((item, i) => (
              <FadeInWhenVisible key={item.step} delay={i * 0.15}>
                <div className="text-center relative">
                  <motion.div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center relative" style={{ background: `${item.color}15` }}
                    whileHover={{ scale: 1.05, rotate: 2 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <item.icon className="w-7 h-7" style={{ color: item.color }} />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">{item.step}</span>
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 10000, label: 'Active Users', icon: Globe, prefix: '', suffix: '+' },
              { value: 2500000, label: 'Money Tracked', icon: TrendingUp, prefix: '$', suffix: '+' },
              { value: 50000, label: 'AI Insights', icon: Bot, prefix: '', suffix: '+' },
              { value: 99, label: 'Uptime', icon: Shield, prefix: '', suffix: '.9%' },
            ].map((stat, i) => (
              <FadeInWhenVisible key={stat.label} delay={i * 0.1} className="text-center">
                <stat.icon className="w-5 h-5 text-emerald-400 mx-auto mb-3" />
                <p className="text-3xl md:text-4xl font-bold gradient-text">
                  <AnimatedCounter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-foreground/60 mt-2">{stat.label}</p>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <FadeInWhenVisible className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-sm text-emerald-400 mb-4">
              <Shield className="w-4 h-4" /> Security First
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Bank-Level <span className="gradient-text">Security</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Your financial data deserves the highest level of protection. Here&apos;s how we keep it safe.</p>
          </FadeInWhenVisible>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SECURITY_FEATURES.map((f, i) => (
              <FadeInWhenVisible key={f.title} delay={i * 0.1}>
                <Card className="glass card-hover border-0 h-full text-center">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                      <f.icon className="w-7 h-7 text-emerald-400" />
                    </div>
                    <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-foreground/70 leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <FadeInWhenVisible className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Loved by <span className="gradient-text">thousands</span></h2>
            <p className="text-foreground/50 max-w-3xl mx-auto">See what our users have to say about their experience.</p>
          </FadeInWhenVisible>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <FadeInWhenVisible key={t.name} delay={i * 0.1}>
                <Card className="glass card-float border-0 h-full relative overflow-hidden group">
                  <div className="absolute top-4 right-4 text-6xl text-white/5 font-serif leading-none select-none group-hover:text-emerald-400/10 transition-colors">&ldquo;</div>
                  <CardContent className="p-6 pt-7 relative">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                    </div>
                    <p className="text-sm text-foreground/70 leading-relaxed mb-6">{t.text}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-emerald-500/15">
                        {t.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                        <p className="text-xs text-foreground/50">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <FadeInWhenVisible className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, transparent <span className="gradient-text">pricing</span></h2>
            <p className="text-muted-foreground">Start free and upgrade as you grow. No hidden fees.</p>
          </FadeInWhenVisible>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map((plan, i) => (
              <FadeInWhenVisible key={plan.name} delay={i * 0.1}>
                <Card className={`card-float border-0 h-full relative overflow-hidden ${plan.highlighted ? 'glass shimmer-border' : 'glass'}`}>
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-semibold px-4 py-1 rounded-full shadow-lg shadow-emerald-500/20">Most Popular</div>
                  )}
                  <CardContent className="p-6 pt-8">
                    <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className={`w-full rounded-xl ${plan.highlighted ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0' : 'glass'}`} onClick={() => setView('register')}>
                      {plan.cta} <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <FadeInWhenVisible className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently asked <span className="gradient-text">questions</span></h2>
          </FadeInWhenVisible>
          <FadeInWhenVisible>
            <Card className="glass border-0">
              <CardContent className="p-2">
                <Accordion type="single" collapsible className="w-full">
                  {FAQS.map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border/50 px-4 last:border-0">
                      <AccordionTrigger className="text-sm font-medium text-left hover:no-underline py-4">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <FadeInWhenVisible>
          <div className="max-w-4xl mx-auto text-center glass rounded-3xl p-10 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 rounded-full filter blur-[100px] pointer-events-none" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 relative">Ready to take control of your <span className="gradient-text">finances</span>?</h2>
            <p className="text-muted-foreground mb-8 relative">Join thousands of users who are already making smarter financial decisions.</p>
            <Button size="lg" onClick={() => setView('register')} className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 text-base px-8 py-6 rounded-xl relative">
              Get Started for Free <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </FadeInWhenVisible>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold">FinWise AI</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Contact</span>
          </div>
          <p className="text-xs text-muted-foreground">&copy; 2025 FinWise AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
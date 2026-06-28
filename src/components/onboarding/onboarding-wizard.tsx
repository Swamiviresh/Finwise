'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/use-app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import {
  ArrowRight, ArrowLeft, Check, Zap, Wallet, Target, Sparkles,
  Utensils, Car, Gamepad2, ShoppingBag, Heart, Lightbulb, PiggyBank, TrendingUp, Shield
} from 'lucide-react'

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
]

const INCOME_RANGES = [
  { label: 'Under $2,000', min: 0, max: 2000 },
  { label: '$2,000 - $5,000', min: 2000, max: 5000 },
  { label: '$5,000 - $10,000', min: 5000, max: 10000 },
  { label: 'Over $10,000', min: 10000, max: 50000 },
]

const FINANCIAL_GOALS = [
  { id: 'save', label: 'Save More', icon: PiggyBank, color: '#34d399', desc: 'Build your savings consistently' },
  { id: 'debt', label: 'Reduce Debt', icon: Shield, color: '#fb7185', desc: 'Pay off loans and credit cards' },
  { id: 'track', label: 'Track Spending', icon: Target, color: '#22d3ee', desc: 'Understand where money goes' },
  { id: 'emergency', label: 'Emergency Fund', icon: Shield, color: '#fbbf24', desc: 'Build 3-6 months safety net' },
  { id: 'invest', label: 'Invest', icon: TrendingUp, color: '#a78bfa', desc: 'Grow wealth over time' },
]

const DEFAULT_BUDGETS = [
  { category: 'Food & Dining', icon: Utensils, pct: 0.25, color: '#34d399' },
  { category: 'Transportation', icon: Car, pct: 0.12, color: '#38bdf8' },
  { category: 'Entertainment', icon: Gamepad2, pct: 0.08, color: '#f97316' },
  { category: 'Shopping', icon: ShoppingBag, pct: 0.10, color: '#fbbf24' },
  { category: 'Healthcare', icon: Heart, pct: 0.08, color: '#fb7185' },
  { category: 'Utilities', icon: Lightbulb, pct: 0.10, color: '#2dd4bf' },
]

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
}

function StepWelcome({ userName, onNext }: { userName: string; onNext: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="flex flex-col items-center justify-center text-center py-8">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/30"
      >
        <Zap className="w-12 h-12 text-white" />
      </motion.div>
      <h2 className="text-3xl sm:text-4xl font-bold mb-3">
        Welcome to <span className="gradient-text text-glow-emerald">FinWise AI</span>
      </h2>
      <p className="text-foreground/70 max-w-md mb-2">Hey <span className="text-foreground font-semibold">{userName}</span>! Let&apos;s set up your finance dashboard in 2 minutes.</p>
      <p className="text-sm text-foreground/50 max-w-sm">We&apos;ll personalize your experience with budgets, goals, and AI-powered insights.</p>
      <div className="flex gap-2 mt-4 mb-8">
        {['📊', '🎯', '🤖', '🔒'].map((emoji, i) => (
          <motion.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="text-2xl"
          >
            {emoji}
          </motion.span>
        ))}
      </div>
      <Button
        size="lg"
        onClick={onNext}
        className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white border-0 px-10 py-6 rounded-xl text-base shadow-xl shadow-emerald-500/20"
      >
        Let&apos;s Get Started <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </motion.div>
  )
}

function StepPreferences({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { setOnboardingData, onboardingData } = useAppStore()
  const [currency, setCurrency] = useState(onboardingData.currency || 'USD')
  const [incomeRange, setIncomeRange] = useState(onboardingData.incomeRange || 1)
  const [goal, setGoal] = useState(onboardingData.goal || '')

  const handleNext = () => {
    setOnboardingData({ currency, incomeRange, goal, incomeRangeData: INCOME_RANGES[incomeRange] })
    onNext()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="py-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Personalize Your Experience</h2>
        <p className="text-sm text-foreground/60">Help us tailor insights to your financial situation.</p>
      </div>

      <div className="space-y-6 max-w-lg mx-auto">
        {/* Currency */}
        <div>
          <p className="text-sm font-medium mb-3">Select your currency</p>
          <div className="grid grid-cols-5 gap-2">
            {CURRENCIES.map(c => (
              <button
                key={c.code}
                onClick={() => setCurrency(c.code)}
                className={`glass rounded-xl p-3 text-center transition-all duration-200 ${
                  currency === c.code ? 'glow-border-emerald bg-emerald-500/10' : 'hover:bg-white/5'
                }`}
              >
                <span className="text-lg font-bold block">{c.symbol}</span>
                <span className="text-[10px] text-foreground/60">{c.code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Income Range */}
        <div>
          <p className="text-sm font-medium mb-3">Monthly income range</p>
          <div className="grid grid-cols-2 gap-2">
            {INCOME_RANGES.map((r, i) => (
              <button
                key={i}
                onClick={() => setIncomeRange(i)}
                className={`glass rounded-xl p-3 text-left transition-all duration-200 ${
                  incomeRange === i ? 'glow-border-emerald bg-emerald-500/10' : 'hover:bg-white/5'
                }`}
              >
                <span className="text-sm font-medium block">{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Financial Goal */}
        <div>
          <p className="text-sm font-medium mb-3">Primary financial goal</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FINANCIAL_GOALS.map(g => (
              <button
                key={g.id}
                onClick={() => setGoal(g.id)}
                className={`glass rounded-xl p-3 text-left transition-all duration-200 flex items-start gap-3 ${
                  goal === g.id ? 'glow-border-emerald bg-emerald-500/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${g.color}15` }}>
                  <g.icon className="w-4.5 h-4.5" style={{ color: g.color }} />
                </div>
                <div>
                  <p className="text-sm font-medium">{g.label}</p>
                  <p className="text-[11px] text-foreground/50">{g.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={onBack} className="text-foreground/60 hover:text-foreground"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        <Button onClick={handleNext} className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white border-0 px-8">
          Continue <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  )
}

function StepBudgets({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { setOnboardingData, onboardingData } = useAppStore()
  const rangeData = (onboardingData.incomeRangeData || INCOME_RANGES[1]) as { min: number; max: number }
  const midIncome = (rangeData.min + rangeData.max) / 2
  const [budgets, setBudgets] = useState(
    DEFAULT_BUDGETS.map(b => ({ ...b, amount: Math.round(midIncome * b.pct) }))
  )

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)

  const handleAmountChange = (index: number, val: number) => {
    const newBudgets = [...budgets]
    newBudgets[index].amount = val
    setBudgets(newBudgets)
  }

  const handleNext = () => {
    setOnboardingData({ budgets })
    onNext()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="py-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Set Up Your Budgets</h2>
        <p className="text-sm text-foreground/60">AI-suggested budgets based on ~${midIncome.toLocaleString()}/month income. Adjust to fit your needs.</p>
        <div className="inline-flex items-center gap-1.5 mt-2 badge-emerald text-[11px]">
          <Sparkles className="w-3 h-3" /> AI Suggested
        </div>
      </div>

      <div className="space-y-4 max-w-lg mx-auto">
        {budgets.map((b, i) => (
          <motion.div
            key={b.category}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${b.color}15` }}>
                  <b.icon className="w-4 h-4" style={{ color: b.color }} />
                </div>
                <span className="text-sm font-medium">{b.category}</span>
              </div>
              <span className="text-sm font-bold" style={{ color: b.color }}>${b.amount.toLocaleString()}</span>
            </div>
            <Slider
              value={[b.amount]}
              onValueChange={([v]) => handleAmountChange(i, v)}
              max={Math.round(midIncome * 0.5)}
              min={50}
              step={25}
              className="w-full"
            />
            <p className="text-[10px] text-foreground/40 mt-1">{Math.round((b.amount / midIncome) * 100)}% of income</p>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-4 mb-2">
        <p className="text-sm text-foreground/60">Total Budget: <span className="font-bold text-foreground">${totalBudget.toLocaleString()}</span> / ${midIncome.toLocaleString()}</p>
        <p className="text-xs text-foreground/40 mt-1">{Math.round(((midIncome - totalBudget) / midIncome) * 100)}% remaining for savings & other</p>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={onBack} className="text-foreground/60 hover:text-foreground"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        <Button onClick={handleNext} className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white border-0 px-8">
          Continue <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  )
}

function StepComplete({ userName, onDone }: { userName: string; onDone: () => void }) {
  const { onboardingData } = useAppStore()
  const budgets = (onboardingData.budgets || []) as { category: string; amount: number; color: string }[]
  const goal = FINANCIAL_GOALS.find(g => g.id === onboardingData.goal)
  const currency = CURRENCIES.find(c => c.code === onboardingData.currency)

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center justify-center text-center py-6">
      {/* Confetti-like celebration */}
      <div className="relative mb-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: ['#34d399', '#22d3ee', '#a78bfa', '#fbbf24', '#fb7185', '#f97316'][i % 6],
              left: '50%',
              top: '50%',
            }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
              x: Math.cos((i * 30 * Math.PI) / 180) * (80 + i * 15),
              y: Math.sin((i * 30 * Math.PI) / 180) * (80 + i * 15) - 40,
              scale: [0, 1.5, 0],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 1.2, delay: 0.3 + i * 0.05, ease: 'easeOut' }}
          />
        ))}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30 relative z-10"
        >
          <Check className="w-10 h-10 text-white" />
        </motion.div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-3xl font-bold mb-2"
      >
        You&apos;re All Set, <span className="gradient-text">{userName.split(' ')[0]}</span>!
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-sm text-foreground/60 mb-6 max-w-sm"
      >
        Your personalized dashboard is ready. Here&apos;s what we&apos;ve set up for you:
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-3 gap-3 w-full max-w-md mb-8"
      >
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-lg mb-1">{currency?.symbol || '$'}</p>
          <p className="text-[11px] text-foreground/60">{currency?.code || 'USD'}</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-lg mb-1">{budgets.length}</p>
          <p className="text-[11px] text-foreground/60">Budgets</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-lg mb-1">{goal?.icon ? <goal.icon className="w-5 h-5 mx-auto" style={{ color: goal.color }} /> : '🎯'}</p>
          <p className="text-[11px] text-foreground/60">{goal?.label || 'Goal'}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          size="lg"
          onClick={onDone}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white border-0 px-10 py-6 rounded-xl text-base shadow-xl shadow-emerald-500/20"
        >
          Go to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  )
}

export default function OnboardingWizard() {
  const { user, setHasCompletedOnboarding } = useAppStore()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  const steps = ['Welcome', 'Preferences', 'Budgets', 'Complete']

  const goNext = () => { setDirection(1); setStep(s => Math.min(s + 1, 3)) }
  const goBack = () => { setDirection(-1); setStep(s => Math.max(s - 1, 0)) }
  const handleDone = () => { setHasCompletedOnboarding(true) }

  return (
    <div className="min-h-screen mesh-bg-enhanced flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                  initial={{ width: '0%' }}
                  animate={{ width: i <= step ? '100%' : '0%' }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              {i < steps.length - 1 && (
                <span className={`text-[10px] font-medium transition-colors ${i < step ? 'text-emerald-400' : 'text-foreground/30'}`}>
                  {s}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <Card className="glass border-0 shimmer-border overflow-hidden">
          <CardContent className="p-6 sm:p-8 min-h-[480px] flex items-center relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full filter blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/5 rounded-full filter blur-[60px] pointer-events-none" />

            <div className="w-full relative z-10">
              <AnimatePresence mode="wait" custom={direction}>
                {step === 0 && <StepWelcome key="welcome" userName={user?.name || 'there'} onNext={goNext} />}
                {step === 1 && <StepPreferences key="prefs" onNext={goNext} onBack={goBack} />}
                {step === 2 && <StepBudgets key="budgets" onNext={goNext} onBack={goBack} />}
                {step === 3 && <StepComplete key="complete" userName={user?.name || 'there'} onDone={handleDone} />}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Skip */}
        {step < 3 && (
          <div className="text-center mt-4">
            <button onClick={handleDone} className="text-xs text-foreground/30 hover:text-foreground/60 transition-colors">
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, ArrowLeft, Eye, EyeOff, Loader2, Check, X } from 'lucide-react'
import { motion } from 'framer-motion'

function getPasswordStrength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return { score, label: ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][Math.min(score, 4)], color: ['text-rose-400', 'text-amber-400', 'text-yellow-400', 'text-emerald-400', 'text-emerald-400'][Math.min(score, 4)] }
}

export default function RegisterPage() {
  const { setView, setUser } = useAppStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const strength = getPasswordStrength(password)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Seed demo data first (creates/updates demo user)
      await fetch('/api/seed', { method: 'POST' })
      
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@finwise.ai', password: 'demo123' }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      setUser(data)
      setView('dashboard')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4 relative">
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-emerald-500/8 rounded-full filter blur-[100px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative">
        <button onClick={() => setView('landing')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <Card className="glass border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Start your journey to financial freedom</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-sm text-rose-400">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} className="glass h-11" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="glass h-11" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Input id="reg-password" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} className="glass h-11 pr-10" required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score
                          ? strength.score <= 2 ? 'bg-rose-400' : strength.score <= 3 ? 'bg-amber-400' : 'bg-emerald-400'
                          : 'bg-muted'}`} />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {[
                        { label: '8+ chars', pass: password.length >= 8 },
                        { label: 'Uppercase', pass: /[A-Z]/.test(password) },
                        { label: 'Number', pass: /[0-9]/.test(password) },
                        { label: 'Special', pass: /[^A-Za-z0-9]/.test(password) },
                      ].map(req => (
                        <span key={req.label} className={`flex items-center gap-1 text-xs ${req.pass ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                          {req.pass ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {req.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" disabled={loading || strength.score < 1} className="w-full h-11 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 rounded-xl">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button type="button" onClick={() => setView('login')} className="text-emerald-400 hover:text-emerald-300 font-medium">Sign In</button>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
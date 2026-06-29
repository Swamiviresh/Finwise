'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Shield, Lock, Eye, Key, Fingerprint, Server, AlertTriangle, CheckCircle2,
  Smartphone, Laptop, Monitor, LogOut, Clock, ShieldCheck, ShieldAlert,
  KeyRound, CircleDot
} from 'lucide-react'
import { motion } from 'framer-motion'
import { format, subHours, subDays } from 'date-fns'
import { toast } from 'sonner'

const SECURITY_ITEMS = [
  { icon: Lock, title: 'End-to-End Encryption', desc: 'All data encrypted with AES-256 in transit and at rest', status: 'active' },
  { icon: Eye, title: 'Zero Data Retention', desc: 'Documents deleted immediately after processing', status: 'active' },
  { icon: Key, title: 'JWT Authentication', desc: 'Secure token-based session management', status: 'active' },
  { icon: Shield, title: 'CSRF Protection', desc: 'Cross-site request forgery protection enabled', status: 'active' },
  { icon: Fingerprint, title: 'Biometric Ready', desc: 'Support for fingerprint and face authentication', status: 'pending' },
  { icon: Server, title: 'Rate Limiting', desc: 'API rate limiting to prevent brute force attacks', status: 'active' },
]

interface Session {
  id: string
  device: string
  icon: typeof Laptop
  ip: string
  location: string
  lastActive: Date
  current: boolean
}

interface ActivityEntry {
  id: string
  action: string
  timestamp: Date
  status: 'success' | 'warning' | 'error'
}

const INITIAL_SESSIONS: Session[] = [
  { id: 's1', device: 'MacBook Pro — Chrome', icon: Laptop, ip: '192.168.1.***', location: 'San Francisco, US', lastActive: new Date(), current: true },
  { id: 's2', device: 'iPhone 15 — Safari', icon: Smartphone, ip: '10.0.0.***', location: 'San Francisco, US', lastActive: subHours(new Date(), 2), current: false },
  { id: 's3', device: 'Windows PC — Firefox', icon: Monitor, ip: '203.45.***.**', location: 'New York, US', lastActive: subDays(new Date(), 1), current: false },
]

const INITIAL_ACTIVITY: ActivityEntry[] = [
  { id: 'a1', action: 'Password changed successfully', timestamp: subHours(new Date(), 1), status: 'success' },
  { id: 'a2', action: 'Login from new device: iPhone 15', timestamp: subHours(new Date(), 2), status: 'warning' },
  { id: 'a3', action: 'Two-factor authentication enabled', timestamp: subDays(new Date(), 1), status: 'success' },
  { id: 'a4', action: 'Failed login attempt detected', timestamp: subDays(new Date(), 2), status: 'error' },
  { id: 'a5', action: 'Security review completed', timestamp: subDays(new Date(), 3), status: 'success' },
]

function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initial
    } catch { return initial }
  })
  const set = (v: T) => {
    setValue(v)
    try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* ignore */ }
  }
  return [value, set]
}

function SecurityScoreRing({ score }: { score: number }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
        <motion.circle
          cx="60" cy="60" r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-bold"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-muted-foreground">out of 100</span>
      </div>
    </div>
  )
}

export default function SecurityPage() {
  const [has2FA, setHas2FA] = useLocalStorage('finwise_2fa', false)
  const [sessions, setSessions] = useLocalStorage<Session[]>('finwise_sessions', INITIAL_SESSIONS)
  const [activity] = useLocalStorage<ActivityEntry[]>('finwise_activity', INITIAL_ACTIVITY)

  // Calculate security score
  const simulatedPasswordLength = 12
  const hasStrongPassword = simulatedPasswordLength >= 8
  const recentLogin = true
  const securityScore = Math.min(
    100,
    (has2FA ? 40 : 0) +
    (hasStrongPassword ? 30 : 10) +
    (recentLogin ? 30 : 10)
  )

  const getScoreLabel = (s: number) => {
    if (s >= 80) return { text: 'Excellent', color: 'text-emerald-400', icon: ShieldCheck }
    if (s >= 50) return { text: 'Good', color: 'text-amber-400', icon: Shield }
    return { text: 'Needs Improvement', color: 'text-rose-400', icon: ShieldAlert }
  }
  const scoreLabel = getScoreLabel(securityScore)
  const ScoreIcon = scoreLabel.icon

  const handleRevokeSession = (id: string) => {
    if (sessions.find(s => s.id === id)?.current) {
      toast.error('Cannot revoke current session')
      return
    }
    setSessions(sessions.filter(s => s.id !== id))
    toast.success('Session revoked')
  }

  const statusIcon = (status: string) => {
    if (status === 'success') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-400" />
    return <CircleDot className="w-4 h-4 text-rose-400" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Security Center</h2>
        <p className="text-sm text-muted-foreground">Manage your account security and privacy</p>
      </div>

      {/* Security Score */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass border-0 glass-card-hover">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
            <SecurityScoreRing score={securityScore} />
            <div className="text-center sm:text-left space-y-2">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <ScoreIcon className={`w-5 h-5 ${scoreLabel.color}`} />
                <h3 className="text-xl font-bold">Security Score: <span className={scoreLabel.color}>{securityScore}/100</span></h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {securityScore >= 80
                  ? 'Your account is well protected. Keep it up!'
                  : securityScore >= 50
                    ? 'Good security posture. Enable 2FA for maximum protection.'
                    : 'Enable 2FA and strengthen your password to improve your score.'}
              </p>
              <div className="flex gap-2 justify-center sm:justify-start">
                <Badge variant="outline" className={`border-border/50 text-[10px] ${has2FA ? 'text-emerald-400 border-emerald-500/30' : 'text-muted-foreground'}`}>
                  <KeyRound className="w-3 h-3 mr-1" /> 2FA {has2FA ? 'On' : 'Off'}
                </Badge>
                <Badge variant="outline" className={`border-border/50 text-[10px] ${hasStrongPassword ? 'text-emerald-400 border-emerald-500/30' : 'text-rose-400 border-rose-500/30'}`}>
                  <Key className="w-3 h-3 mr-1" /> {hasStrongPassword ? 'Strong' : 'Weak'} Password
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECURITY_ITEMS.map((item, i) => (
          <motion.div key={item.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="glass border-0 h-full glass-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                      {item.status === 'active' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px]">Active</Badge>
                      ) : (
                        <Badge className="bg-amber-500/10 text-amber-400 border-0 text-[10px]">Pending</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Active Sessions */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="glass border-0 glass-card-hover">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Active Sessions
              <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px] ml-auto">{sessions.length} active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active sessions</p>
            ) : (
              sessions.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <s.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{s.device}</p>
                      {s.current && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full shrink-0">Current</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Shield className="w-3 h-3" />{s.ip}</span>
                      <span className="text-xs text-muted-foreground">{s.location}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{format(s.lastActive, 'MMM d, h:mm a')}</span>
                    </div>
                  </div>
                  {!s.current && (
                    <Button
                      variant="ghost" size="sm"
                      className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={() => handleRevokeSession(s.id)}
                    >
                      <LogOut className="w-3.5 h-3.5 mr-1" /> Revoke
                    </Button>
                  )}
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Activity Log */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="glass border-0 glass-card-hover">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Security Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/30" />
              <div className="space-y-4">
                {activity.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    className="flex items-start gap-3 relative"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.06 }}
                  >
                    <div className="w-[31px] h-[31px] rounded-full bg-background flex items-center justify-center shrink-0 z-10">
                      {statusIcon(entry.status)}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-sm">{entry.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{format(entry.timestamp, 'MMM d, yyyy \at h:mm a')}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Privacy Controls */}
      <Card className="glass border-0 glass-card-hover">
        <CardHeader><CardTitle className="text-base">Privacy Controls</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium">Two-Factor Authentication</p><p className="text-xs text-muted-foreground">Add extra security to your account</p></div>
            <Switch checked={has2FA} onCheckedChange={(v) => { setHas2FA(v); toast.success(v ? '2FA enabled' : '2FA disabled') }} />
          </div>
          {[
            { label: 'Login Notifications', desc: 'Get notified of new sign-ins', enabled: true },
            { label: 'Session Timeout (30 min)', desc: 'Auto-logout after inactivity', enabled: true },
            { label: 'IP Allowlist', desc: 'Restrict access to specific IPs', enabled: false },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
              <Switch defaultChecked={item.enabled} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Privacy */}
      <Card className="glass border-0 glass-card-hover">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> AI Privacy Guarantees</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            {[
              'AI only sees anonymized financial summaries — never raw data',
              'Bank account numbers, card numbers, and personal identifiers are redacted before AI analysis',
              'Conversation memory is disabled — each chat starts fresh',
              'User financial information is never used for model training',
              'All uploaded documents are permanently deleted after processing',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
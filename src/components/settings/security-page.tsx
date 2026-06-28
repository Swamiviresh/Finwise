'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Shield, Lock, Eye, Key, Fingerprint, Server, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const SECURITY_ITEMS = [
  { icon: Lock, title: 'End-to-End Encryption', desc: 'All data encrypted with AES-256 in transit and at rest', status: 'active' },
  { icon: Eye, title: 'Zero Data Retention', desc: 'Documents deleted immediately after processing', status: 'active' },
  { icon: Key, title: 'JWT Authentication', desc: 'Secure token-based session management', status: 'active' },
  { icon: Shield, title: 'CSRF Protection', desc: 'Cross-site request forgery protection enabled', status: 'active' },
  { icon: Fingerprint, title: 'Biometric Ready', desc: 'Support for fingerprint and face authentication', status: 'pending' },
  { icon: Server, title: 'Rate Limiting', desc: 'API rate limiting to prevent brute force attacks', status: 'active' },
]

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Security Center</h2>
        <p className="text-sm text-muted-foreground">Manage your account security and privacy</p>
      </div>

      {/* Security Score */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass border-0">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center glow-emerald">
                <Shield className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold">Security Score: <span className="text-emerald-400">92/100</span></h3>
              <p className="text-sm text-muted-foreground mt-1">Your account is well protected. Enable biometric auth for maximum security.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECURITY_ITEMS.map((item, i) => (
          <motion.div key={item.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="glass border-0 h-full">
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

      {/* Privacy Controls */}
      <Card className="glass border-0">
        <CardHeader><CardTitle className="text-base">Privacy Controls</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Two-Factor Authentication', desc: 'Add extra security to your account', enabled: false },
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
      <Card className="glass border-0">
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
'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Download, Trash2, RefreshCw, Shield, Smartphone, Laptop, Globe, User, Palette, Lock, Database, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'devices', label: 'Devices', icon: Database },
  { id: 'data', label: 'Data Management', icon: Database },
]

const MOCK_DEVICES = [
  { name: 'MacBook Pro', icon: Laptop, lastActive: 'Active now', current: true },
  { name: 'iPhone 15', icon: Smartphone, lastActive: '2 hours ago', current: false },
  { name: 'Windows PC', icon: Globe, lastActive: '3 days ago', current: false },
]

export default function SettingsPage() {
  const { user, setUser } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('profile')
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')

  const handleSave = () => {
    if (user) setUser({ ...user, name, email })
    toast.success('Profile updated')
  }

  const handleClearChat = async () => {
    if (!user?.id) return
    await fetch(`/api/ai-chat?userId=${user.id}`, { method: 'DELETE' })
    toast.success('Chat history cleared')
  }

  const handleReseed = async () => {
    if (!user?.id) return
    await fetch('/api/seed', { method: 'POST' })
    toast.success('Demo data refreshed')
  }

  const handleDeleteAccount = () => {
    setUser(null)
    toast.success('Account deleted')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Nav */}
        <nav className="lg:col-span-1">
          <Card className="glass border-0">
            <CardContent className="p-2">
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeSection === s.id ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
                  <s.icon className="w-4 h-4" />
                  {s.label}
                </button>
              ))}
            </CardContent>
          </Card>
        </nav>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Card className="glass border-0">
                <CardHeader><CardTitle className="text-base">Profile Information</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-500 text-white text-xl font-semibold">
                        {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user?.name}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <Separator className="bg-border/30" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} className="glass" /></div>
                    <div className="space-y-2"><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} className="glass" /></div>
                  </div>
                  <Button onClick={handleSave} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0">Save Changes</Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeSection === 'appearance' && (
            <motion.div key="appearance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Card className="glass border-0">
                <CardHeader><CardTitle className="text-base">Theme</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: Monitor },
                    ].map(t => (
                      <button key={t.value} onClick={() => setTheme(t.value)}
                        className={`p-4 rounded-xl glass flex flex-col items-center gap-2 transition-all ${theme === t.value ? 'ring-1 ring-emerald-500 bg-emerald-500/10' : 'hover:bg-white/5'}`}>
                        <t.icon className={`w-6 h-6 ${theme === t.value ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeSection === 'privacy' && (
            <motion.div key="privacy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Card className="glass border-0">
                <CardHeader><CardTitle className="text-base">Privacy Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Allow AI to analyze transactions', desc: 'AI will generate insights from your spending data', defaultChecked: true, disabled: false },
                    { label: 'Delete documents after processing', desc: 'Uploaded documents are permanently deleted after analysis', defaultChecked: true, disabled: true },
                    { label: 'Anonymous analytics', desc: 'Help improve FinWise with anonymous usage data', defaultChecked: false, disabled: false },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                      <Switch defaultChecked={item.defaultChecked} disabled={item.disabled} />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="glass border-0">
                <CardHeader><CardTitle className="text-base">Data Actions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start glass" onClick={() => toast.info('Data export started')}>
                    <Download className="w-4 h-4 mr-2" /> Download My Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start glass text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={handleClearChat}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete All Chat History
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeSection === 'devices' && (
            <motion.div key="devices" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Card className="glass border-0">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Connected Devices</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs text-rose-400 hover:text-rose-300">Sign out all</Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {MOCK_DEVICES.map(d => (
                    <div key={d.name} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><d.icon className="w-5 h-5 text-muted-foreground" /></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2"><p className="text-sm font-medium">{d.name}</p>{d.current && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">Current</span>}</div>
                        <p className="text-xs text-muted-foreground">{d.lastActive}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeSection === 'data' && (
            <motion.div key="data" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Card className="glass border-0">
                <CardHeader><CardTitle className="text-base">Storage</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden mb-2">
                    <div className="h-full w-1/3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" />
                  </div>
                  <p className="text-xs text-muted-foreground">2.4 MB of 10 MB used</p>
                </CardContent>
              </Card>
              <Card className="glass border-0">
                <CardHeader><CardTitle className="text-base">Data Management</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start glass" onClick={() => toast.info('Export started')}>
                    <Download className="w-4 h-4 mr-2" /> Export All Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start glass" onClick={handleReseed}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Reseed Demo Data
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start glass text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                        <AlertTriangle className="w-4 h-4 mr-2" /> Delete Account Permanently
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass border-0">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete your account and all associated data. This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="glass">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-rose-500 hover:bg-rose-600">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
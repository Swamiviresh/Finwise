'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Trash2, MessageSquare, Bot, AlertTriangle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const SUGGESTIONS = [
  'How can I save more this month?',
  'What subscriptions should I cancel?',
  'Am I spending too much on dining?',
  'How is my financial health?',
  'Create a savings plan for me',
  "What's my biggest expense category?",
  'How can I reach my goals faster?',
  'Forecast my next month\'s spending',
]

export default function AICoachPage() {
  const { user, expenses, incomes, budgets, goals, chatMessages, addChatMessage, clearChatMessages } = useAppStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const buildFinancialSummary = () => {
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0)
    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
    const catMap: Record<string, number> = {}
    expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount })
    const budgetStatus = budgets.map(b => `${b.category}: ${Math.round((b.spent / b.limit) * 100)}% of ${b.limit} used`)
    const goalStatus = goals.map(g => `${g.title}: ${Math.round((g.currentAmount / g.targetAmount) * 100)}% saved`)

    return JSON.stringify({
      totalExpense: Math.round(totalExpense),
      totalIncome: Math.round(totalIncome),
      netSavings: Math.round(totalIncome - totalExpense),
      savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0,
      topCategories: Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => ({ category: k, amount: Math.round(v) })),
      budgetStatus,
      goalStatus,
      transactionCount: expenses.length,
    })
  }

  const handleSend = async (message?: string) => {
    const msg = message || input.trim()
    if (!msg || !user?.id || loading) return

    setInput('')
    addChatMessage({ id: Date.now().toString(), role: 'user', content: msg, createdAt: new Date().toISOString() })
    setLoading(true)

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, financialSummary: buildFinancialSummary(), userId: user.id }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      addChatMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content: data.response, createdAt: new Date().toISOString() })
    } catch {
      addChatMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', createdAt: new Date().toISOString() })
      toast.error('AI response failed')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleClear = async () => {
    if (!user?.id) return
    try {
      await fetch(`/api/ai-chat?userId=${user.id}`, { method: 'DELETE' })
      clearChatMessages()
      toast.success('Chat cleared')
    } catch { toast.error('Failed to clear') }
  }

  return (
    <div className="space-y-4 h-full">
      {/* Disclaimer */}
      <Card className="glass border-0">
        <CardContent className="p-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-muted-foreground">AI-generated insights for educational purposes only. Not financial advice. Always consult a qualified financial advisor.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-14rem)]">
        {/* Chat Area */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="glass border-0 flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between shrink-0">
              <CardTitle className="text-base flex items-center gap-2"><Bot className="w-4 h-4 text-emerald-400" /> AI Finance Coach</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleClear} className="text-xs text-muted-foreground hover:text-rose-400">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1">Ask me anything about your finances</h3>
                    <p className="text-sm text-muted-foreground">I can analyze your spending, suggest savings, and help you reach your goals.</p>
                  </div>
                )}
                <AnimatePresence>
                  {chatMessages.map(msg => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'chat-bubble-user rounded-br-md' : 'chat-bubble-ai rounded-bl-md'}`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="chat-bubble-ai rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} className="w-2 h-2 rounded-full bg-emerald-400" />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
            <CardContent className="p-3 border-t border-border/30 shrink-0">
              <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-2">
                <Input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about your finances..." className="glass flex-1" disabled={loading} />
                <Button type="submit" disabled={!input.trim() || loading} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0 px-4 shrink-0">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Suggestion Cards */}
        <div className="hidden lg:block">
          <Card className="glass border-0 h-full">
            <CardHeader className="pb-2"><CardTitle className="text-base">Suggested Questions</CardTitle></CardHeader>
            <CardContent className="space-y-2 overflow-y-auto max-h-[calc(100vh-18rem)]">
              {SUGGESTIONS.map((s, i) => (
                <motion.button key={s} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => handleSend(s)}
                  className="w-full text-left p-3 rounded-xl glass-subtle text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 hover:glow-border-emerald transition-all">
                  {s}
                </motion.button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
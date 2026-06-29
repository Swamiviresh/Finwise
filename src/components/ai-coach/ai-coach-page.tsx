'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Trash2, Bot, AlertTriangle, Loader2, Sparkles, TrendingUp, Target, PiggyBank, Receipt, Lightbulb, BarChart3 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { renderMarkdown } from '@/lib/markdown'

const SUGGESTIONS = [
  { text: 'How can I save more this month?', icon: PiggyBank, color: '#34d399' },
  { text: 'What subscriptions should I cancel?', icon: Receipt, color: '#f472b6' },
  { text: 'Am I spending too much on dining?', icon: TrendingUp, color: '#fbbf24' },
  { text: 'How is my financial health?', icon: BarChart3, color: '#22d3ee' },
  { text: 'Create a savings plan for me', icon: Target, color: '#a78bfa' },
  { text: "What's my biggest expense?", icon: Sparkles, color: '#f97316' },
  { text: 'How can I reach my goals faster?', icon: Lightbulb, color: '#fbbf24' },
  { text: 'Forecast my next month spending', icon: TrendingUp, color: '#fb7185' },
]

export default function AICoachPage() {
  const { user, expenses, incomes, budgets, goals, chatMessages, addChatMessage, clearChatMessages } = useAppStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  useEffect(() => {
    if (chatMessages.length > 0) setShowSuggestions(false)
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
    setShowSuggestions(false)
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
      setShowSuggestions(true)
      toast.success('Chat cleared')
    } catch { toast.error('Failed to clear') }
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Disclaimer */}
      <Card className="glass border-0 shrink-0">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-xs text-foreground/50">AI-generated insights for educational purposes only. Not financial advice. Always consult a qualified advisor.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        {/* Chat Area */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <Card className="glass border-0 flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between shrink-0 border-b border-white/5">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                AI Finance Coach
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-medium">Online</span>
              </CardTitle>
              {chatMessages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClear} className="text-xs text-foreground/40 hover:text-rose-400 h-8">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear Chat
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-4">
                {/* Enhanced Empty State */}
                {chatMessages.length === 0 && !showSuggestions && (
                  <div className="text-center py-16">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 flex items-center justify-center mx-auto mb-5 border border-emerald-500/10"
                    >
                      <Bot className="w-10 h-10 text-emerald-400" />
                    </motion.div>
                    <h3 className="text-xl font-bold mb-2">Ask me anything about your finances</h3>
                    <p className="text-sm text-foreground/50 max-w-xs mx-auto mb-6">I analyze your spending patterns, suggest savings strategies, and help you reach your financial goals.</p>
                    <Button variant="outline" onClick={() => setShowSuggestions(true)} className="glass border-white/10 text-foreground/70 hover:text-foreground hover:bg-white/5">
                      <Sparkles className="w-4 h-4 mr-2 text-emerald-400" /> Show Suggestions
                    </Button>
                  </div>
                )}

                {/* Suggestion Cards (shown when empty) */}
                {chatMessages.length === 0 && showSuggestions && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-2">Quick Questions</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SUGGESTIONS.map((s, i) => (
                        <motion.button
                          key={s.text}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => handleSend(s.text)}
                          className="w-full text-left p-3.5 rounded-xl glass-subtle text-sm text-foreground/80 hover:text-foreground hover:glow-border-emerald transition-all flex items-start gap-3 group"
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ background: `${s.color}15` }}>
                            <s.icon className="w-4 h-4" style={{ color: s.color }} />
                          </div>
                          <span className="leading-snug pt-0.5">{s.text}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Chat Messages */}
                <AnimatePresence>
                  {chatMessages.map(msg => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'chat-bubble-user rounded-br-md' : 'chat-bubble-ai rounded-bl-md'}`}>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <Bot className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px] font-semibold text-emerald-400/70">FinWise AI</span>
                          </div>
                        )}
                        {msg.role === 'assistant'
                          ? renderMarkdown(msg.content)
                          : <p className="whitespace-pre-wrap">{msg.content}</p>
                        }
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
            {/* Input Area */}
            <CardContent className="p-3 border-t border-white/5 shrink-0">
              {/* Mobile suggestion pills */}
              {chatMessages.length === 0 && showSuggestions && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none lg:hidden">
                  {SUGGESTIONS.slice(0, 4).map(s => (
                    <button key={s.text} onClick={() => handleSend(s.text)} className="shrink-0 glass-subtle rounded-full px-3 py-1.5 text-xs text-foreground/70 hover:text-foreground whitespace-nowrap transition-colors">
                      {s.text}
                    </button>
                  ))}
                </div>
              )}
              <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-2">
                <Input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about your finances..." className="glass flex-1 h-11" disabled={loading} />
                <Button type="submit" disabled={!input.trim() || loading} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0 px-4 h-11 shrink-0 hover:shadow-lg hover:shadow-emerald-500/20 transition-shadow">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Suggestion Cards */}
        <div className="hidden lg:block">
          <Card className="glass border-0 h-full overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/5">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Suggested Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 overflow-y-auto p-3 max-h-[calc(100vh-20rem)]">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={s.text}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handleSend(s.text)}
                  className="w-full text-left p-3 rounded-xl glass-subtle text-sm text-foreground/70 hover:text-foreground hover:glow-border-emerald transition-all flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ background: `${s.color}12` }}>
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <span className="leading-snug">{s.text}</span>
                </motion.button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
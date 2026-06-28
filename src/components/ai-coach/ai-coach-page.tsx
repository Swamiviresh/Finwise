'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Trash2, Bot, User, Sparkles, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/store/use-app-store'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { format } from 'date-fns'

const SUGGESTIONS = [
  'How can I save more this month?',
  'What subscriptions should I cancel?',
  'Am I spending too much on dining?',
  'How is my financial health?',
  'Create a savings plan for me',
  "What's my biggest expense category?",
  'How can I reach my goals faster?',
  "Forecast my next month's spending",
]

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 px-4 py-3 max-w-xs"
    >
      <div className="chat-bubble-ai rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </motion.div>
  )
}

export default function AICoachPage() {
  const { chatMessages, addChatMessage, clearChatMessages, expenses, incomes, budgets, goals, user, healthScore } = useAppStore()
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages, isLoading, scrollToBottom])

  const buildFinancialSummary = useCallback(() => {
    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

    const categoryMap: Record<string, number> = {}
    for (const exp of expenses) {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount
    }
    const categoryBreakdown = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
      .join(', ')

    const budgetStatus = budgets
      .map(b => `${b.category}: $${b.spent.toFixed(2)} / $${b.limit.toFixed(2)} (${Math.round((b.spent / b.limit) * 100)}%)`)
      .join('; ')

    const goalsProgress = goals
      .map(g => `${g.icon} ${g.title}: $${g.currentAmount.toFixed(0)} / $${g.targetAmount.toFixed(0)} (${Math.round((g.currentAmount / g.targetAmount) * 100)}%)`)
      .join('; ')

    return JSON.stringify({
      totalIncome: totalIncome.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      netSavings: (totalIncome - totalExpenses).toFixed(2),
      healthScore,
      categoryBreakdown,
      budgetStatus,
      goalsProgress,
      expenseCount: expenses.length,
      incomeCount: incomes.length,
    }, null, 2)
  }, [expenses, incomes, budgets, goals, healthScore])

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading || !user) return

    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: message.trim(),
      createdAt: new Date().toISOString(),
    }
    addChatMessage(userMsg)
    setInput('')
    setIsLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const financialSummary = buildFinancialSummary()
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          financialSummary,
          userId: user.id,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get response')

      addChatMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        createdAt: new Date().toISOString(),
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message')
      addChatMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date().toISOString(),
      })
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, user, addChatMessage, buildFinancialSummary])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  const handleClearChat = async () => {
    if (!user) return
    clearChatMessages()
    try {
      await fetch(`/api/ai-chat?userId=${user.id}`, { method: 'DELETE' })
      toast.success('Chat history cleared')
    } catch {
      toast.error('Failed to clear chat history')
    }
  }

  const handleSuggestionClick = (text: string) => {
    sendMessage(text)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 glass rounded-2xl overflow-hidden">
        {/* Disclaimer Banner */}
        <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-amber-500 shrink-0" />
          <span>AI-generated insights for educational purposes only. Not financial advice.</span>
        </div>

        {/* Messages */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {chatMessages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full text-center py-12 gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Bot className="size-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">FinWise AI Coach</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Ask me anything about your finances. I&apos;ll analyze your spending, suggest savings, and help you reach your goals.
                </p>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {chatMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mt-1">
                    <Bot className="size-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'chat-bubble-user rounded-br-sm'
                        : 'chat-bubble-ai rounded-bl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_strong]:text-emerald-400 [&_h3]:text-emerald-400 [&_h3]:text-base [&_h3]:mt-3 [&_h3]:mb-1">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap m-0">{msg.content}</p>
                    )}
                  </div>
                  <p className={`text-[10px] text-muted-foreground mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {format(new Date(msg.createdAt), 'h:mm a')}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center mt-1">
                    <User className="size-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-white/5 p-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your finances..."
                className="min-h-[44px] max-h-[160px] resize-none rounded-xl bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground focus-visible:ring-emerald-500/30 pr-3 py-3 text-sm"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-11 w-11 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white p-0"
            >
              <Send className="size-4" />
            </Button>
          </div>
          <div className="flex justify-end mt-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              disabled={chatMessages.length === 0 || isLoading}
              className="h-7 text-xs text-muted-foreground hover:text-rose-400 gap-1"
            >
              <Trash2 className="size-3" />
              Clear Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Suggestion Cards Sidebar */}
      <div className="w-full lg:w-72 xl:w-80 shrink-0">
        <div className="glass rounded-2xl p-4 h-full">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="size-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">Suggested Questions</h3>
          </div>
          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {SUGGESTIONS.map((suggestion, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isLoading}
                className="w-full text-left px-3 py-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/20 text-xs text-muted-foreground hover:text-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import Markdown from 'react-markdown'
import { toast } from 'sonner'
import {
  Send,
  Plus,
  MessageSquare,
  Trash2,
  Sparkles,
  Bot,
  PanelLeftClose,
  PanelLeft,
  TrendingUp,
  PiggyBank,
  Lightbulb,
  BarChart3,
  AlertTriangle,
  X,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LocalChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: Date
}

interface LocalChat {
  id: string
  title: string
  messages: LocalChatMessage[]
  createdAt: Date
  updatedAt: Date
}

// ---------------------------------------------------------------------------
// Financial AI Tips (fallback when API is unavailable)
// ---------------------------------------------------------------------------

const FINANCIAL_TIPS: Record<string, string> = {
  spending: `## 📊 Spending Analysis

Based on common spending patterns, here are some key insights:

### Top Recommendations:
1. **Track every expense** — Awareness is the first step to financial health
2. **Apply the 50/30/20 rule** — 50% needs, 30% wants, 20% savings
3. **Review subscriptions monthly** — Cancel unused services
4. **Use cashback & rewards** — Make your spending work for you
5. **Set category limits** — Prevent overspending in specific areas

### Action Items:
- Review your last 30 days of transactions
- Identify your top 3 spending categories
- Set a realistic monthly budget for each category`,

  budget: `## 💰 Budget Suggestion

Here's a recommended monthly budget structure based on the **50/30/20 rule**:

### Essential Expenses (50%)
| Category | Allocation |
|----------|-----------|
| Housing | 30% |
| Groceries | 10% |
| Transportation | 5% |
| Utilities | 3% |
| Insurance | 2% |

### Lifestyle (30%)
| Category | Allocation |
|----------|-----------|
| Dining Out | 8% |
| Entertainment | 5% |
| Shopping | 7% |
| Personal Care | 5% |
| Misc | 5% |

### Savings & Goals (20%)
| Category | Allocation |
|----------|-----------|
| Emergency Fund | 8% |
| Retirement | 7% |
| Financial Goals | 5% |

> 💡 **Tip**: Adjust these percentages based on your income level and financial priorities.`,

  savings: `## 💡 Smart Savings Strategies

Here are proven ways to save more money:

### 1. **Automate Your Savings**
Set up automatic transfers to your savings account on payday. "Pay yourself first."

### 2. **The 24-Hour Rule**
Before any non-essential purchase over $50, wait 24 hours. You'll be surprised how many impulse buys you avoid.

### 3. **Meal Planning**
Plan your meals weekly. This can save **30-40%** on food costs compared to eating out or impulse grocery shopping.

### 4. **Energy Savings**
- Use LED bulbs (save ~$75/year)
- Adjust thermostat by 2 degrees (save ~$180/year)
- Unplug devices when not in use

### 5. **Subscription Audit**
Review all subscriptions quarterly. The average person has **$237/month** in recurring charges they forget about.

### Quick Wins:
- 🏦 Round up purchases and save the difference
- 📱 Use cashback apps for routine purchases
- ☕ Brew coffee at home (save ~$1,500/year)
- 🚶 Walk or bike for short trips`,

  insights: `## 📈 Financial Insights

### Key Financial Health Metrics:

**1. Savings Rate**
Aim for at least **20%** of your net income. The national average is only 5-7%.

**2. Emergency Fund**
Target **3-6 months** of essential expenses. This provides a safety net for unexpected events.

**3. Debt-to-Income Ratio**
Keep this below **36%**. Lenders use this to assess your borrowing capacity.

**4. Net Worth Trend**
Track your net worth monthly. It should trend upward over time, even if slowly.

### Weekly Financial Checklist:
- [ ] Review transactions for the week
- [ ] Check budget progress
- [ ] Verify all bills are paid
- [ ] Log any cash spending
- [ ] Review savings goals progress

### Red Flags to Watch:
- ⚠️ Using credit cards for daily expenses without paying in full
- ⚠️ No emergency fund
- ⚠️ Living paycheck to paycheck
- ⚠️ No retirement contributions`,

  unusual: `## 🔍 Unusual Spending Detection

Here are common patterns of unusual spending to watch for:

### Potential Red Flags:
1. **Subscription creep** — New recurring charges you don't remember signing up for
2. **Category spikes** — Any category suddenly 50%+ higher than your 3-month average
3. **Frequency changes** — Coffee shop visits doubling, more takeout orders, etc.
4. **Round number purchases** — Large round-number transactions may indicate impulse buys
5. **Late-night purchases** — Emotional spending often happens late at night

### How to Detect Unusual Spending:
- Set up **budget alerts** at 50%, 75%, and 90% thresholds
- Review your **weekly spending summary** for anomalies
- Compare current month to **rolling 3-month averages**
- Enable **transaction notifications** for amounts over a set threshold

### Quick Fix Actions:
- Cancel unused subscriptions immediately
- Set daily/weekly spending limits in high-risk categories
- Use a **cool-down period** for purchases over $100`,
}

function getLocalResponse(input: string): string {
  const lower = input.toLowerCase()

  if (lower.includes('spend') || lower.includes('analyz')) {
    return FINANCIAL_TIPS.spending
  }
  if (lower.includes('budget') || lower.includes('suggest')) {
    return FINANCIAL_TIPS.budget
  }
  if (lower.includes('save') || lower.includes('sav')) {
    return FINANCIAL_TIPS.savings
  }
  if (lower.includes('insight') || lower.includes('financial')) {
    return FINANCIAL_TIPS.insights
  }
  if (lower.includes('unusual') || lower.includes('detect') || lower.includes('anomal')) {
    return FINANCIAL_TIPS.unusual
  }
  if (lower.includes('invest')) {
    return `## 📈 Investment Guidance

For beginners, here's a solid investment approach:

### 1. **Start with an Emergency Fund**
Before investing, save 3-6 months of expenses in a high-yield savings account.

### 2. **Employer Match (Free Money!)**
If your employer offers a 401(k) match, contribute at least enough to get the full match. It's an instant return on investment.

### 3. **Index Funds**
Low-cost index funds (like those tracking the S&P 500) historically outperform 80% of actively managed funds over 10+ years.

### 4. **Diversification**
Spread investments across:
- **Domestic stocks** (60-70%)
- **International stocks** (15-25%)
- **Bonds** (10-20%)
- **REITs / Alternatives** (5-10%)

### 5. **Dollar-Cost Averaging**
Invest a fixed amount regularly regardless of market conditions. This reduces the impact of volatility.

> ⚠️ **Disclaimer**: This is educational content, not personalized financial advice. Always consider consulting a certified financial advisor.`
  }
  if (lower.includes('debt') || lower.includes('loan')) {
    return `## 💳 Debt Management Strategy

### Two Popular Methods:

**Avalanche Method** (Mathematically optimal):
1. Pay minimums on all debts
2. Put extra money toward the **highest interest rate** debt
3. When that's paid off, move to the next highest rate

**Snowball Method** (Psychologically motivating):
1. Pay minimums on all debts
2. Put extra money toward the **smallest balance** debt
3. When that's paid off, move to the next smallest

### Quick Tips:
- Consider **balance transfer cards** with 0% APR for high-interest credit card debt
- Look into **student loan refinancing** if you have good credit
- Never pay just the minimum on credit cards
- Automate minimum payments to avoid late fees`
  }

  return `I'd be happy to help with your financial questions! Here are some topics I can assist with:

- 📊 **Spending Analysis** — Analyze your spending patterns
- 💰 **Budget Planning** — Create a personalized budget
- 💡 **Savings Tips** — Smart ways to save more
- 📈 **Financial Insights** — Understand your financial health
- 🔍 **Unusual Spending** — Detect anomalies in your spending
- 📈 **Investment Basics** — Getting started with investing
- 💳 **Debt Management** — Strategies to reduce debt

Try asking a specific question, or use the quick action buttons below!`
}

// ---------------------------------------------------------------------------
// Quick Actions
// ---------------------------------------------------------------------------

const QUICK_ACTIONS = [
  { label: 'Analyze my spending', prompt: 'Analyze my spending patterns and give me a detailed breakdown', icon: BarChart3 },
  { label: 'Suggest a budget', prompt: 'Create a personalized monthly budget suggestion for me', icon: PiggyBank },
  { label: 'How can I save more?', prompt: 'Give me practical tips to save more money each month', icon: TrendingUp },
  { label: 'Show financial insights', prompt: 'Show me key financial insights and health metrics', icon: Lightbulb },
  { label: 'Detect unusual spending', prompt: 'Help me detect any unusual or anomalous spending patterns', icon: AlertTriangle },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AiAssistantPage() {
  // --- Chat state ---
  const [chats, setChats] = React.useState<LocalChat[]>([])
  const [activeChatId, setActiveChatId] = React.useState<string | null>(null)
  const [input, setInput] = React.useState('')
  const [isTyping, setIsTyping] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(true)

  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = React.useRef<HTMLDivElement>(null)

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null

  // --- Auto-scroll ---
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeChat?.messages, isTyping])

  // --- Auto-resize textarea ---
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  // --- Generate unique ID ---
  const genId = React.useCallback(() => crypto.randomUUID(), [])

  // --- Create new chat ---
  const createChat = React.useCallback(() => {
    const newChat: LocalChat = {
      id: genId(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setChats((prev) => [newChat, ...prev])
    setActiveChatId(newChat.id)
    setInput('')
  }, [genId])

  // --- Delete chat ---
  const deleteChat = React.useCallback(
    (chatId: string) => {
      setChats((prev) => prev.filter((c) => c.id !== chatId))
      if (activeChatId === chatId) {
        setActiveChatId(null)
      }
    },
    [activeChatId],
  )

  // --- Send message ---
  const handleSend = React.useCallback(
    async (messageContent?: string) => {
      const content = (messageContent || input).trim()
      if (!content || isTyping) return

      let chatId = activeChatId

      // Create a new chat if none active
      if (!chatId) {
        const newChat: LocalChat = {
          id: genId(),
          title: content.slice(0, 50),
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        setChats((prev) => [newChat, ...prev])
        chatId = newChat.id
        setActiveChatId(chatId)
      }

      const userMessage: LocalChatMessage = {
        id: genId(),
        role: 'user',
        content,
        createdAt: new Date(),
      }

      // Add user message and update title on first message
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                title: c.messages.length === 0 ? content.slice(0, 50) : c.title,
                messages: [...c.messages, userMessage],
                updatedAt: new Date(),
              }
            : c,
        ),
      )

      setInput('')
      setIsTyping(true)

      try {
        // Try the real API first
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('token')
            : null
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        if (token) headers.Authorization = `Bearer ${token}`

        // Build message history for API
        const currentChat = chats.find((c) => c.id === chatId)
        const apiMessages = [
          ...(currentChat?.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })) ?? []),
          { role: 'user', content },
        ]

        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify({ messages: apiMessages }),
        })

        if (res.ok) {
          const data = await res.json()
          const aiContent = data.content || data.message || data.data?.content || ''
          if (aiContent) {
            const assistantMessage: LocalChatMessage = {
              id: genId(),
              role: 'assistant',
              content: aiContent,
              createdAt: new Date(),
            }
            setChats((prev) =>
              prev.map((c) =>
                c.id === chatId
                  ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: new Date() }
                  : c,
              ),
            )
            setIsTyping(false)
            return
          }
        }
        // Fall through to local response
      } catch {
        // Fall through to local response
      }

      // Fallback to local financial tips
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200))
      const response = getLocalResponse(content)
      const assistantMessage: LocalChatMessage = {
        id: genId(),
        role: 'assistant',
        content: response,
        createdAt: new Date(),
      }

      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: new Date() }
            : c,
        ),
      )
      setIsTyping(false)
    },
    [input, isTyping, activeChatId, chats, genId],
  )

  // --- Handle keyboard ---
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  // --- Empty state ---
  if (!activeChat && chats.length === 0) {
    return (
      <div className="flex h-full">
        {/* Mobile sidebar toggle */}
        <div className="absolute top-4 left-4 z-10 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <PanelLeft className="size-5" />
          </Button>
        </div>

        {/* Welcome screen */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-1 flex-col items-center justify-center gap-8 p-6"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="size-10 text-primary" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">
                AI Financial Assistant
              </h1>
              <p className="mt-2 max-w-md text-muted-foreground">
                Get personalized financial insights, budget recommendations, and
                smart money advice powered by AI.
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="w-full max-w-2xl">
            <p className="mb-4 text-center text-sm font-medium text-muted-foreground">
              Try asking about:
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon
                return (
                  <motion.button
                    key={action.label}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSend(action.prompt)}
                    className="group flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium leading-tight">
                      {action.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Input area at bottom */}
          <div className="w-full max-w-2xl">
            <div className="flex items-end gap-2 rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-2 shadow-sm">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your finances..."
                className="min-h-[44px] flex-1 resize-none border-0 bg-transparent p-2 text-sm shadow-none focus-visible:ring-0"
                rows={1}
              />
              <Button
                size="icon"
                className="size-10 shrink-0 rounded-xl"
                onClick={() => handleSend()}
                disabled={!input.trim()}
              >
                <Send className="size-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // --- Chat view ---
  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex shrink-0 flex-col border-r bg-muted/30 overflow-hidden"
          >
            {/* Sidebar header */}
            <div className="flex items-center justify-between p-3">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={createChat}
              >
                <Plus className="size-4" />
                New Chat
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setSidebarOpen(false)}
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </div>

            {/* Chat list */}
            <ScrollArea className="flex-1 px-2">
              <div className="space-y-1 pb-4">
                {chats.map((chat) => (
                  <motion.div
                    key={chat.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="group flex items-center gap-2"
                  >
                    <button
                      onClick={() => setActiveChatId(chat.id)}
                      className={cn(
                        'flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
                        activeChatId === chat.id && 'bg-accent font-medium',
                      )}
                    >
                      <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{chat.title}</span>
                    </button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => deleteChat(chat.id)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete chat</TooltipContent>
                    </Tooltip>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-2 border-b px-4 py-3">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setSidebarOpen(true)}
            >
              <PanelLeft className="size-4" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">
                {activeChat?.title || 'AI Assistant'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {activeChat?.messages.length ?? 0} messages
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6"
        >
          <div className="mx-auto max-w-3xl space-y-6">
            <AnimatePresence mode="popLayout">
              {activeChat?.messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                    message.role === 'system' && 'justify-center',
                  )}
                >
                  {message.role === 'system' ? (
                    <div className="rounded-full bg-muted px-4 py-1.5 text-xs text-muted-foreground">
                      {message.content}
                    </div>
                  ) : (
                    <>
                      {message.role === 'assistant' && (
                        <Avatar className="mt-0.5 size-8 shrink-0">
                          <AvatarFallback className="bg-primary/10">
                            <Bot className="size-4 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          'max-w-[80%] space-y-2',
                          message.role === 'user' ? 'items-end' : 'items-start',
                        )}
                      >
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted',
                          )}
                        >
                          {message.role === 'assistant' ? (
                            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-h2:mt-3 prose-h2:mb-1 prose-h3:mt-2 prose-h3:mb-1 prose-blockquote:my-1 prose-table:my-2 prose-th:p-1 prose-td:p-1 prose-pre:my-2 prose-code:text-xs">
                              <Markdown>{message.content}</Markdown>
                            </div>
                          ) : (
                            message.content
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(message.createdAt), 'h:mm a')}
                        </p>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                <Avatar className="mt-0.5 size-8 shrink-0">
                  <AvatarFallback className="bg-primary/10">
                    <Bot className="size-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
                  <span className="sr-only">AI is thinking</span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="size-2 rounded-full bg-muted-foreground/40"
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t bg-background p-4">
          <div className="mx-auto max-w-3xl">
            {/* Quick actions */}
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.label}
                    onClick={() => handleSend(action.prompt)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <Icon className="size-3" />
                    {action.label}
                  </button>
                )
              })}
            </div>

            {/* Text input */}
            <div className="flex items-end gap-2 rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-2 shadow-sm transition-shadow focus-within:shadow-md">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your finances..."
                className="min-h-[44px] flex-1 resize-none border-0 bg-transparent p-2 text-sm shadow-none focus-visible:ring-0"
                rows={1}
                disabled={isTyping}
              />
              <Button
                size="icon"
                className="size-10 shrink-0 rounded-xl"
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
              >
                {isTyping ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Send className="size-4" />
                  </motion.div>
                ) : (
                  <Send className="size-4" />
                )}
                <span className="sr-only">Send message</span>
              </Button>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              AI can make mistakes. Verify important financial decisions with a
              professional advisor.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

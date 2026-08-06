// ============================================================================
// FinWise - AI Service with Provider Abstraction
// ============================================================================

import { db } from '@/lib/db';
import type { DashboardData } from '@/types';

// ---------------------------------------------------------------------------
// AI Provider Interface
// ---------------------------------------------------------------------------

export interface AIProvider {
  chat(
    messages: { role: string; content: string }[],
    systemPrompt?: string,
  ): Promise<string>;
}

// ---------------------------------------------------------------------------
// OpenAI-compatible Provider (uses local /api/ai/chat)
// ---------------------------------------------------------------------------

class OpenAIProvider implements AIProvider {
  async chat(
    messages: { role: string; content: string }[],
    systemPrompt?: string,
  ): Promise<string> {
    const allMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!response.ok) {
        throw new Error(`AI service returned ${response.status}`);
      }

      const data = await response.json();
      return data.content || data.message || 'No response generated.';
    } catch (error) {
      console.error('[AI Service Error]', error);
      return 'I apologize, but I\'m currently unable to process your request. Please try again later.';
    }
  }
}

// ---------------------------------------------------------------------------
// Simple Local Provider (rule-based fallback)
// ---------------------------------------------------------------------------

class LocalAIProvider implements AIProvider {
  async chat(
    messages: { role: string; content: string }[],
    _systemPrompt?: string,
  ): Promise<string> {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const lower = lastMessage.toLowerCase();

    if (lower.includes('budget') || lower.includes('spend')) {
      return 'Based on your spending patterns, I recommend the 50/30/20 rule: allocate 50% of your income to needs, 30% to wants, and 20% to savings. Review your categories to find areas where you can reduce expenses.';
    }

    if (lower.includes('save') || lower.includes('saving')) {
      return 'To boost your savings: 1) Automate transfers to a savings account, 2) Track every expense for a month, 3) Cancel unused subscriptions, 4) Use the 24-hour rule for non-essential purchases, 5) Consider meal planning to reduce food costs.';
    }

    if (lower.includes('invest')) {
      return 'For beginner investors: Start with an emergency fund (3-6 months expenses), consider low-cost index funds, maximize any employer 401(k) match, and diversify across asset classes. Always consider your risk tolerance and time horizon.';
    }

    if (lower.includes('debt') || lower.includes('loan')) {
      return 'To manage debt effectively: Use the avalanche method (pay highest interest first) or snowball method (smallest balance first). Consider consolidating high-interest debt and always pay at least the minimum on all accounts.';
    }

    return 'I can help with budgeting advice, savings strategies, investment guidance, and debt management. Could you please provide more details about your financial question?';
  }
}

// ---------------------------------------------------------------------------
// Provider Factory
// ---------------------------------------------------------------------------

export function createAIProvider(type: string = 'openai'): AIProvider {
  switch (type) {
    case 'openai':
      return new OpenAIProvider();
    case 'local':
      return new LocalAIProvider();
    default:
      return new LocalAIProvider();
  }
}

// ---------------------------------------------------------------------------
// Finance Context Builder
// ---------------------------------------------------------------------------

export async function getFinanceContext(userId: string): Promise<string> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return 'No user data available.';

  // Get recent transactions summary
  const recentTransactions = await db.transaction.findMany({
    where: { userId },
    take: 50,
    orderBy: { date: 'desc' },
    include: { category: true },
  });

  const budgets = await db.budget.findMany({
    where: { userId, isActive: true },
  });

  const goals = await db.goal.findMany({
    where: { userId },
  });

  let totalIncome = 0;
  let totalExpenses = 0;
  const categorySummary: Record<string, number> = {};

  for (const t of recentTransactions) {
    if (t.type === 'income') totalIncome += t.amount;
    else if (t.type === 'expense') {
      totalExpenses += t.amount;
      const catName = t.category?.name || 'Other';
      categorySummary[catName] = (categorySummary[catName] || 0) + t.amount;
    }
  }

  const topCategories = Object.entries(categorySummary)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, amount]) => `${name}: $${amount.toFixed(2)}`)
    .join(', ');

  const goalsInfo = goals
    .map(
      (g) =>
        `${g.name}: ${((g.currentAmount / g.targetAmount) * 100).toFixed(0)}% complete ($${g.currentAmount.toFixed(0)} / $${g.targetAmount.toFixed(0)})`,
    )
    .join('; ');

  return `
User: ${user.name || user.email}
Currency: ${user.currency}

Financial Summary (from ${recentTransactions.length} recent transactions):
- Total Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Net: $${(totalIncome - totalExpenses).toFixed(2)}
- Savings Rate: ${totalIncome > 0 ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1) : 0}%

Top Expense Categories: ${topCategories || 'No expense data'}

Active Budgets: ${budgets.length} (${budgets.map((b) => `${b.name}: $${b.amount}`).join(', ') || 'none'})

Financial Goals: ${goalsInfo || 'No goals set'}
`.trim();
}

// ---------------------------------------------------------------------------
// Financial Insights
// ---------------------------------------------------------------------------

export async function generateFinancialInsights(
  userId: string,
): Promise<string> {
  const context = await getFinanceContext(userId);
  const provider = createAIProvider();

  return provider.chat(
    [
      {
        role: 'user',
        content:
          'Based on my financial data, provide 3-5 key insights about my spending habits and financial health. Be specific and actionable.',
      },
    ],
    `You are a financial advisor AI assistant. Analyze the user's financial data and provide specific, actionable insights. Be concise but thorough. Here is the user's financial context:\n\n${context}`,
  );
}

// ---------------------------------------------------------------------------
// Budget Suggestions
// ---------------------------------------------------------------------------

export async function suggestBudget(userId: string): Promise<string> {
  const context = await getFinanceContext(userId);
  const provider = createAIProvider();

  return provider.chat(
    [
      {
        role: 'user',
        content:
          'Create a recommended monthly budget for me based on my spending patterns and income. Include suggested amounts for each category.',
      },
    ],
    `You are a financial advisor AI assistant. Create a practical, personalized budget recommendation based on the user's actual spending data. Use specific numbers and explain your reasoning. Here is the user's financial context:\n\n${context}`,
  );
}

// ---------------------------------------------------------------------------
// Spending Pattern Analysis
// ---------------------------------------------------------------------------

export async function analyzeSpendingPatterns(
  userId: string,
): Promise<string> {
  const context = await getFinanceContext(userId);
  const provider = createAIProvider();

  return provider.chat(
    [
      {
        role: 'user',
        content:
          'Analyze my spending patterns. Are there any concerning trends? Where am I overspending? What areas can I improve?',
      },
    ],
    `You are a financial advisor AI assistant. Analyze the user's spending data to identify patterns, trends, and areas for improvement. Be specific about categories and amounts. Here is the user's financial context:\n\n${context}`,
  );
}

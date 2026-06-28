import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Get current month expenses
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const monthExpenses = await db.expense.findMany({
      where: { userId, date: { gte: monthStart, lt: monthEnd } },
    })

    const totalMonthExpense = monthExpenses.reduce((sum, e) => sum + e.amount, 0)

    // Get current month income
    const monthIncome = await db.income.findMany({
      where: { userId, date: { gte: monthStart, lt: monthEnd } },
    })
    const totalMonthIncome = monthIncome.reduce((sum, i) => sum + i.amount, 0)

    // Get budgets
    const budgets = await db.budget.findMany({ where: { userId } })
    const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0)
    const totalBudgetSpent = budgets.reduce((sum, b) => sum + b.spent, 0)

    // Get goals
    const goals = await db.goal.findMany({ where: { userId } })
    const hasEmergencyGoal = goals.some(g => g.title.toLowerCase().includes('emergency'))

    // Calculate scores (0-100)
    // 1. Savings rate (max 25 points)
    const savingsRate = totalMonthIncome > 0 ? (totalMonthIncome - totalMonthExpense) / totalMonthIncome : 0
    const savingsScore = Math.min(25, Math.max(0, savingsRate * 100 * 0.5))

    // 2. Budget adherence (max 25 points)
    const budgetAdherence = totalBudget > 0 ? 1 - (totalBudgetSpent / totalBudget) : 0.5
    const budgetScore = Math.min(25, Math.max(0, budgetAdherence * 25))

    // 3. Emergency fund (max 15 points)
    const emergencyScore = hasEmergencyGoal ? 15 : 0

    // 4. Subscription load (max 15 points) - count recurring expenses
    const recurringCount = monthExpenses.filter(e => e.isRecurring).length
    const subscriptionScore = Math.max(0, 15 - recurringCount * 1.5)

    // 5. Spending diversity (max 10 points)
    const categories = new Set(monthExpenses.map(e => e.category))
    const diversityScore = Math.min(10, categories.size * 1.2)

    // 6. Income stability (max 10 points)
    const recurringIncome = monthIncome.filter(i => i.isRecurring).length
    const incomeScore = Math.min(10, recurringIncome * 5)

    const totalScore = Math.round(
      savingsScore + budgetScore + emergencyScore + subscriptionScore + diversityScore + incomeScore
    )

    return NextResponse.json({
      score: totalScore,
      breakdown: {
        savingsRate: { score: Math.round(savingsScore), max: 25, value: `${Math.round(savingsRate * 100)}%` },
        budgetAdherence: { score: Math.round(budgetScore), max: 25, value: `${Math.round(budgetAdherence * 100)}%` },
        emergencyFund: { score: emergencyScore, max: 15, value: hasEmergencyGoal ? 'Yes' : 'No' },
        subscriptionLoad: { score: Math.round(subscriptionScore), max: 15, value: `${recurringCount} recurring` },
        spendingDiversity: { score: Math.round(diversityScore), max: 10, value: `${categories.size} categories` },
        incomeStability: { score: incomeScore, max: 10, value: `${recurringIncome} recurring` },
      },
      totalExpense: totalMonthExpense,
      totalIncome: totalMonthIncome,
      netSavings: totalMonthIncome - totalMonthExpense,
    })
  } catch (error) {
    console.error('Health score error:', error)
    return NextResponse.json({ error: 'Failed to calculate health score' }, { status: 500 })
  }
}
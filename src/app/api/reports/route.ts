import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    const period = req.nextUrl.searchParams.get('period') || 'monthly'

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'annual':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const expenses = await db.expense.findMany({
      where: { userId, date: { gte: startDate } },
      orderBy: { date: 'desc' },
    })

    const incomes = await db.income.findMany({
      where: { userId, date: { gte: startDate } },
      orderBy: { date: 'desc' },
    })

    // Category breakdown
    const categoryMap: Record<string, number> = {}
    for (const exp of expenses) {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount
    }

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount)

    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0)
    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)

    // Daily spending trend
    const dailyMap: Record<string, number> = {}
    for (const exp of expenses) {
      const day = exp.date.toISOString().split('T')[0]
      dailyMap[day] = (dailyMap[day] || 0) + exp.amount
    }
    const dailyTrend = Object.entries(dailyMap)
      .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Top expenses
    const topExpenses = [...expenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(e => ({ title: e.title, amount: e.amount, category: e.category, date: e.date.toISOString().split('T')[0] }))

    return NextResponse.json({
      period,
      totalExpense: Math.round(totalExpense * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      netSavings: Math.round((totalIncome - totalExpense) * 100) / 100,
      transactionCount: expenses.length,
      categoryBreakdown,
      dailyTrend,
      topExpenses,
      averageDailySpend: Math.round((totalExpense / Math.max(1, new Date(now.getTime() - startDate.getTime()).getDate())) * 100) / 100,
    })
  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
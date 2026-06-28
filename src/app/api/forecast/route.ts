import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const now = new Date()
    const months = 6
    const monthlyData: { month: string; expenses: number; income: number }[] = []

    for (let m = months - 1; m >= 0; m--) {
      const d = subMonths(now, m)
      const mStart = startOfMonth(d)
      const mEnd = endOfMonth(d)
      const exps = await db.expense.findMany({ where: { userId, date: { gte: mStart, lt: mEnd } } })
      const incs = await db.income.findMany({ where: { userId, date: { gte: mStart, lt: mEnd } } })
      monthlyData.push({
        month: format(d, 'MMM'),
        expenses: exps.reduce((s, e) => s + e.amount, 0),
        income: incs.reduce((s, i) => s + i.amount, 0),
      })
    }

    const n = monthlyData.length
    const avgExpense = monthlyData.reduce((s, m) => s + m.expenses, 0) / n
    const avgIncome = monthlyData.reduce((s, m) => s + m.income, 0) / n

    let sumX = 0, sumYE = 0, sumYI = 0, sumXYE = 0, sumXYI = 0, sumX2 = 0
    monthlyData.forEach((m, i) => {
      sumX += i; sumYE += m.expenses; sumYI += m.income
      sumXYE += i * m.expenses; sumXYI += i * m.income; sumX2 += i * i
    })
    const denom = n * sumX2 - sumX * sumX
    const expSlope = denom !== 0 ? (n * sumXYE - sumX * sumYE) / denom : 0
    const incSlope = denom !== 0 ? (n * sumXYI - sumX * sumYI) / denom : 0

    const forecast = ['Next Month', 'Month +2', 'Month +3'].map((label, i) => {
      const idx = n + i
      const predictedExpense = Math.max(0, Math.round((avgExpense + expSlope * idx) * 100) / 100)
      const predictedIncome = Math.max(0, Math.round((avgIncome + incSlope * idx) * 100) / 100)
      return {
        month: label,
        predictedExpense,
        predictedIncome,
        predictedSavings: Math.round((predictedIncome - predictedExpense) * 100) / 100,
        savingsRate: predictedIncome > 0 ? Math.round(((predictedIncome - predictedExpense) / predictedIncome) * 100) : 0,
      }
    })

    const lastTwo = monthlyData.slice(-2).map(m => m.expenses)
    const trendPercent = lastTwo[0] > 0 ? Math.round(((lastTwo[1] - lastTwo[0]) / lastTwo[0]) * 100) : 0

    const currentMonth = startOfMonth(now)
    const previousMonth = subMonths(now, 1)
    const [currentExps, previousExps] = await Promise.all([
      db.expense.findMany({ where: { userId, date: { gte: currentMonth } } }),
      db.expense.findMany({ where: { userId, date: { gte: previousMonth, lt: currentMonth } } }),
    ])
    const catMap: Record<string, { current: number; previous: number }> = {}
    currentExps.forEach(e => { if (!catMap[e.category]) catMap[e.category] = { current: 0, previous: 0 }; catMap[e.category].current += e.amount })
    previousExps.forEach(e => { if (!catMap[e.category]) catMap[e.category] = { current: 0, previous: 0 }; catMap[e.category].previous += e.amount })

    const categoryTrends = Object.entries(catMap)
      .map(([category, data]) => ({
        category,
        current: Math.round(data.current),
        previous: Math.round(data.previous),
        change: data.previous > 0 ? Math.round(((data.current - data.previous) / data.previous) * 100) : 0,
      }))
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 5)

    return NextResponse.json({
      historical: monthlyData.map(m => ({ month: m.month, expenses: Math.round(m.expenses), income: Math.round(m.income), savings: Math.round(m.income - m.expenses) })),
      forecast,
      trend: { direction: trendPercent > 5 ? 'increasing' : trendPercent < -5 ? 'decreasing' : 'stable', percent: trendPercent, avgExpense: Math.round(avgExpense), avgIncome: Math.round(avgIncome) },
      categoryTrends,
    })
  } catch (error) {
    console.error('Forecast error:', error)
    return NextResponse.json({ error: 'Forecast failed' }, { status: 500 })
  }
}
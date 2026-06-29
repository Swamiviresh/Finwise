import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function formatDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatAmount(n: number): string {
  return n.toFixed(2)
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function csvRow(...values: string[]): string {
  return values.map(escapeCsv).join(',') + '\n'
}

function getStartDate(period: string): Date {
  const now = new Date()
  switch (period) {
    case 'weekly':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case 'annual':
      return new Date(now.getFullYear() - 1, now.getMonth(), 1)
    default: // monthly
      return new Date(now.getFullYear(), now.getMonth(), 1)
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    const type = req.nextUrl.searchParams.get('type')
    const period = req.nextUrl.searchParams.get('period') || 'monthly'

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (!type || !['expenses', 'incomes', 'report'].includes(type)) {
      return NextResponse.json(
        { error: 'type is required and must be one of: expenses, incomes, report' },
        { status: 400 },
      )
    }

    if (!['weekly', 'monthly', 'annual'].includes(period)) {
      return NextResponse.json(
        { error: 'period must be one of: weekly, monthly, annual' },
        { status: 400 },
      )
    }

    const today = formatDate(new Date())
    let csv = ''
    let filename = ''

    if (type === 'expenses') {
      const expenses = await db.expense.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      })

      csv = csvRow('Date', 'Title', 'Category', 'Amount', 'Recurring', 'Description')
      for (const e of expenses) {
        csv += csvRow(
          formatDate(new Date(e.date)),
          e.title,
          e.category,
          formatAmount(e.amount),
          e.isRecurring ? 'Yes' : 'No',
          e.description || '',
        )
      }

      filename = `finwise-expenses-${today}.csv`
    } else if (type === 'incomes') {
      const incomes = await db.income.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      })

      csv = csvRow('Date', 'Title', 'Source', 'Amount', 'Recurring')
      for (const i of incomes) {
        csv += csvRow(
          formatDate(new Date(i.date)),
          i.title,
          i.source,
          formatAmount(i.amount),
          i.isRecurring ? 'Yes' : 'No',
        )
      }

      filename = `finwise-incomes-${today}.csv`
    } else if (type === 'report') {
      const startDate = getStartDate(period)

      const expenses = await db.expense.findMany({
        where: { userId, date: { gte: startDate } },
        orderBy: { date: 'desc' },
      })

      const incomes = await db.income.findMany({
        where: { userId, date: { gte: startDate } },
        orderBy: { date: 'desc' },
      })

      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
      const totalIncomes = incomes.reduce((sum, i) => sum + i.amount, 0)
      const netSavings = totalIncomes - totalExpenses
      const savingsRate = totalIncomes > 0 ? (netSavings / totalIncomes) * 100 : 0

      // Summary section
      csv += csvRow('FINANCIAL REPORT', '', '', '')
      csv += csvRow(`Period`, period, `From`, formatDate(startDate))
      csv += csvRow(`Generated`, today, '', '')
      csv += '\n'

      csv += csvRow('SUMMARY', '', '', '')
      csv += csvRow('Total Income', formatAmount(totalIncomes))
      csv += csvRow('Total Expenses', formatAmount(totalExpenses))
      csv += csvRow('Net Savings', formatAmount(netSavings))
      csv += csvRow('Savings Rate', `${savingsRate.toFixed(2)}%`)
      csv += '\n'

      // Expense rows
      csv += csvRow('EXPENSES', '', '', '', '', '')
      csv += csvRow('Date', 'Title', 'Category', 'Amount', 'Recurring', 'Description')
      for (const e of expenses) {
        csv += csvRow(
          formatDate(new Date(e.date)),
          e.title,
          e.category,
          formatAmount(e.amount),
          e.isRecurring ? 'Yes' : 'No',
          e.description || '',
        )
      }
      csv += '\n'

      // Income rows
      csv += csvRow('INCOMES', '', '', '', '')
      csv += csvRow('Date', 'Title', 'Source', 'Amount', 'Recurring')
      for (const i of incomes) {
        csv += csvRow(
          formatDate(new Date(i.date)),
          i.title,
          i.source,
          formatAmount(i.amount),
          i.isRecurring ? 'Yes' : 'No',
        )
      }

      filename = `finwise-report-${today}.csv`
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 })
  }
}
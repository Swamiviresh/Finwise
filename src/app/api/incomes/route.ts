import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    const source = req.nextUrl.searchParams.get('source')
    const month = req.nextUrl.searchParams.get('month')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId }

    if (source && source !== 'All') {
      where.source = source
    }

    if (month) {
      const startDate = new Date(month + '-01T00:00:00.000Z')
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)
      where.date = { gte: startDate, lt: endDate }
    }

    const incomes = await db.income.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(incomes)
  } catch (error) {
    console.error('Get incomes error:', error)
    return NextResponse.json({ error: 'Failed to fetch incomes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { userId, title, amount, source, date, isRecurring } = data

    if (!userId || !title || !amount || !source || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const income = await db.income.create({
      data: {
        userId,
        title,
        amount: parseFloat(amount),
        source,
        date: new Date(date),
        isRecurring: isRecurring || false,
      },
    })

    return NextResponse.json(income)
  } catch (error) {
    console.error('Create income error:', error)
    return NextResponse.json({ error: 'Failed to create income' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await db.income.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete income error:', error)
    return NextResponse.json({ error: 'Failed to delete income' }, { status: 500 })
  }
}
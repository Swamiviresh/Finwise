import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const budgets = await db.budget.findMany({
      where: { userId },
      orderBy: { category: 'asc' },
    })

    return NextResponse.json(budgets)
  } catch (error) {
    console.error('Get budgets error:', error)
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { userId, category, limit, period } = data

    if (!userId || !category || !limit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const budget = await db.budget.create({
      data: {
        userId,
        category,
        limit: parseFloat(limit),
        spent: 0,
        period: period || 'monthly',
      },
    })

    return NextResponse.json(budget)
  } catch (error) {
    console.error('Create budget error:', error)
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await db.budget.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete budget error:', error)
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 })
  }
}
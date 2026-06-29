import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const goals = await db.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(goals)
  } catch (error) {
    console.error('Get goals error:', error)
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''

    // Handle add-funds via FormData
    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData()
      const goalId = formData.get('goalId') as string | null
      const amount = formData.get('amount') as string | null

      if (!goalId || !amount) {
        return NextResponse.json({ error: 'goalId and amount are required' }, { status: 400 })
      }

      const existing = await db.goal.findUnique({ where: { id: goalId } })
      if (!existing) {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
      }

      const addAmount = parseFloat(amount)
      if (isNaN(addAmount) || addAmount <= 0) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
      }

      const updated = await db.goal.update({
        where: { id: goalId },
        data: { currentAmount: existing.currentAmount + addAmount },
      })

      return NextResponse.json(updated)
    }

    // Handle goal creation via JSON
    const data = await req.json()
    const { userId, title, targetAmount, deadline, icon, color } = data

    if (!userId || !title || !targetAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const goal = await db.goal.create({
      data: {
        userId,
        title,
        targetAmount: parseFloat(targetAmount),
        currentAmount: 0,
        deadline: deadline ? new Date(deadline) : null,
        icon: icon || '🎯',
        color: color || '#10b981',
      },
    })

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Create goal error:', error)
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { id, currentAmount } = data

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const goal = await db.goal.update({
      where: { id },
      data: { currentAmount: parseFloat(currentAmount) },
    })

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Update goal error:', error)
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await db.goal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete goal error:', error)
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}
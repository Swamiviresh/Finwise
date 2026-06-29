import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    const expenseId = req.nextUrl.searchParams.get('expenseId')
    const incomeId = req.nextUrl.searchParams.get('incomeId')
    const expenseTagMap = req.nextUrl.searchParams.get('expenseTagMap')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Get all expense-tag mappings for the user (for list views)
    if (expenseTagMap === 'true') {
      const allExpenseIds = await db.expense.findMany({
        where: { userId },
        select: { id: true },
      })
      const ids = allExpenseIds.map((e) => e.id)

      const transactionTags = await db.transactionTag.findMany({
        where: { expenseId: { in: ids } },
        include: { tag: true },
      })

      const map: Record<string, Array<{ id: string; name: string; color: string }>> = {}
      for (const tt of transactionTags) {
        if (tt.expenseId && tt.tag) {
          if (!map[tt.expenseId]) map[tt.expenseId] = []
          map[tt.expenseId].push({ id: tt.tag.id, name: tt.tag.name, color: tt.tag.color })
        }
      }
      return NextResponse.json(map)
    }

    // Get tags for a specific transaction
    if (expenseId) {
      const transactionTags = await db.transactionTag.findMany({
        where: { expenseId },
        include: { tag: true },
      })
      return NextResponse.json(transactionTags.map((tt) => tt.tag))
    }

    if (incomeId) {
      const transactionTags = await db.transactionTag.findMany({
        where: { incomeId },
        include: { tag: true },
      })
      return NextResponse.json(transactionTags.map((tt) => tt.tag))
    }

    // List all tags for user
    const tags = await db.tag.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tags)
  } catch (error) {
    console.error('Get tags error:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, name, color } = await req.json()

    if (!userId || !name) {
      return NextResponse.json({ error: 'userId and name are required' }, { status: 400 })
    }

    // Check uniqueness
    const existing = await db.tag.findUnique({
      where: { userId_name: { userId, name: name.trim() } },
    })

    if (existing) {
      return NextResponse.json({ error: 'Tag already exists', tag: existing }, { status: 409 })
    }

    const tag = await db.tag.create({
      data: {
        userId,
        name: name.trim(),
        color: color || '#10b981',
      },
    })

    return NextResponse.json(tag)
  } catch (error) {
    console.error('Create tag error:', error)
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await db.transactionTag.deleteMany({ where: { tagId: id } })
    await db.tag.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete tag error:', error)
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { tagId, expenseId, incomeId } = await req.json()

    if (!tagId) {
      return NextResponse.json({ error: 'tagId is required' }, { status: 400 })
    }

    if (!expenseId && !incomeId) {
      return NextResponse.json({ error: 'expenseId or incomeId is required' }, { status: 400 })
    }

    // Find existing TransactionTag
    const where: Record<string, string> = { tagId }
    if (expenseId) where.expenseId = expenseId
    if (incomeId) where.incomeId = incomeId

    const existing = await db.transactionTag.findFirst({ where })

    if (existing) {
      // Untag: delete the relation
      await db.transactionTag.delete({ where: { id: existing.id } })
      return NextResponse.json({ tagged: false, transactionTagId: existing.id })
    } else {
      // Tag: create the relation
      const tt = await db.transactionTag.create({
        data: {
          tagId,
          expenseId: expenseId || null,
          incomeId: incomeId || null,
        },
        include: { tag: true },
      })
      return NextResponse.json({ tagged: true, transactionTag: tt })
    }
  } catch (error) {
    console.error('Toggle tag error:', error)
    return NextResponse.json({ error: 'Failed to toggle tag' }, { status: 500 })
  }
}

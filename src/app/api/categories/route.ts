import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food', icon: '🍽️', color: '#34d399' },
  { name: 'Rent', icon: '🏠', color: '#22d3ee' },
  { name: 'Shopping', icon: '🛍️', color: '#fbbf24' },
  { name: 'Healthcare', icon: '💊', color: '#fb7185' },
  { name: 'Education', icon: '📚', color: '#a78bfa' },
  { name: 'Transportation', icon: '🚗', color: '#38bdf8' },
  { name: 'Entertainment', icon: '🎮', color: '#f97316' },
  { name: 'Utilities', icon: '💡', color: '#2dd4bf' },
  { name: 'Investments', icon: '💰', color: '#4ade80' },
  { name: 'Insurance', icon: '🛡️', color: '#c084fc' },
  { name: 'Subscriptions', icon: '📱', color: '#f472b6' },
  { name: 'Others', icon: '📋', color: '#94a3b8' },
]

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', icon: '💰', color: '#34d399' },
  { name: 'Freelance', icon: '💻', color: '#22d3ee' },
  { name: 'Investments', icon: '📈', color: '#fbbf24' },
  { name: 'Business', icon: '🏢', color: '#a78bfa' },
  { name: 'Gifts', icon: '🎁', color: '#fb7185' },
  { name: 'Rental', icon: '🏠', color: '#f97316' },
  { name: 'Others', icon: '📋', color: '#94a3b8' },
]

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    const type = req.nextUrl.searchParams.get('type')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId }
    if (type && (type === 'expense' || type === 'income')) {
      where.type = type
    }

    const customCategories = await db.category.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    })

    // Determine which defaults to include
    const defaults = type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES
    const effectiveType = type || 'expense'
    const customNames = customCategories.map((c) => c.name)

    const mergedCategories = [
      // Default categories that user hasn't created custom versions of
      ...defaults
        .filter((d) => !customNames.includes(d.name))
        .map((d) => ({
          id: `default-${d.name.toLowerCase()}`,
          userId,
          name: d.name,
          icon: d.icon,
          color: d.color,
          type: effectiveType,
          isDefault: true,
          createdAt: new Date(0).toISOString(),
          updatedAt: new Date(0).toISOString(),
        })),
      // Custom categories (including those overriding defaults)
      ...customCategories.map((c) => ({
        id: c.id,
        userId: c.userId,
        name: c.name,
        icon: c.icon,
        color: c.color,
        type: c.type,
        isDefault: c.isDefault,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    ]

    return NextResponse.json(mergedCategories)
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { userId, name, icon, color, type } = data

    if (!userId || !name) {
      return NextResponse.json({ error: 'userId and name are required' }, { status: 400 })
    }

    const categoryType = type === 'income' ? 'income' : 'expense'

    // Check for name uniqueness per user
    const existing = await db.category.findFirst({
      where: { userId, name, type: categoryType },
    })
    if (existing) {
      return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 })
    }

    const category = await db.category.create({
      data: {
        userId,
        name: name.trim(),
        icon: icon || '📋',
        color: color || '#10b981',
        type: categoryType,
        isDefault: false,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { id, name, icon, color, type } = data

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (icon !== undefined) updateData.icon = icon
    if (color !== undefined) updateData.color = color
    if (type !== undefined) updateData.type = type

    const category = await db.category.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Update category error:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Don't allow deleting default categories
    if (id.startsWith('default-')) {
      return NextResponse.json({ error: 'Cannot delete default categories' }, { status: 400 })
    }

    // Verify it's not a default category in the DB
    const category = await db.category.findUnique({ where: { id } })
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    if (category.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default categories' }, { status: 400 })
    }

    await db.category.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
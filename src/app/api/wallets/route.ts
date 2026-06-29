import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const wallets = await db.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(wallets)
  } catch (error) {
    console.error('Get wallets error:', error)
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { userId, name, type, balance, currency, color, icon } = data

    if (!userId || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validTypes = ['checking', 'savings', 'credit', 'cash', 'investment']
    const walletType = validTypes.includes(type) ? type : 'checking'

    const wallet = await db.wallet.create({
      data: {
        userId,
        name,
        type: walletType,
        balance: balance ? parseFloat(balance) : 0,
        currency: currency || 'USD',
        color: color || '#10b981',
        icon: icon || '💳',
      },
    })

    return NextResponse.json(wallet)
  } catch (error) {
    console.error('Create wallet error:', error)
    return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { id, amount } = data

    if (!id || amount === undefined) {
      return NextResponse.json({ error: 'id and amount are required' }, { status: 400 })
    }

    const existing = await db.wallet.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    const newBalance = existing.balance + parseFloat(amount)
    const updated = await db.wallet.update({
      where: { id },
      data: { balance: newBalance },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update wallet error:', error)
    return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await db.wallet.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete wallet error:', error)
    return NextResponse.json({ error: 'Failed to delete wallet' }, { status: 500 })
  }
}
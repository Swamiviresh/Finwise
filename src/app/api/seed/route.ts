import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

const CATEGORIES = ['Food', 'Rent', 'Shopping', 'Healthcare', 'Education', 'Transportation', 'Entertainment', 'Utilities', 'Investments', 'Insurance', 'Subscriptions', 'Others']

const EXPENSE_TITLES: Record<string, string[]> = {
  Food: ['Grocery Store', 'Restaurant Dinner', 'Coffee Shop', 'Food Delivery', 'Lunch at Work', 'Weekend Brunch'],
  Rent: ['Monthly Rent', 'Parking Fee', 'Home Insurance'],
  Shopping: ['New Clothes', 'Electronics', 'Home Decor', 'Books', 'Online Shopping'],
  Healthcare: ['Doctor Visit', 'Pharmacy', 'Gym Membership', 'Dental Checkup'],
  Education: ['Online Course', 'Books', 'Workshop Fee', 'Certification Exam'],
  Transportation: ['Uber Ride', 'Gas Station', 'Public Transit Pass', 'Car Maintenance'],
  Entertainment: ['Movie Tickets', 'Streaming Service', 'Concert Tickets', 'Gaming'],
  Utilities: ['Electric Bill', 'Water Bill', 'Internet Bill', 'Phone Bill'],
  Investments: ['Stock Purchase', 'Mutual Fund', 'ETF Investment', 'Crypto'],
  Insurance: ['Health Insurance', 'Car Insurance', 'Life Insurance Premium'],
  Subscriptions: ['Netflix', 'Spotify', 'Cloud Storage', 'Adobe Creative', 'GitHub Pro'],
  Others: ['Gifts', 'Charity', 'Pet Expenses', 'Miscellaneous'],
}

const INCOME_SOURCES = ['Salary', 'Freelance Project', 'Investment Returns', 'Side Business', 'Consulting', 'Dividend', 'Bonus', 'Rental Income']

function randomBetween(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function randomDate(monthsBack: number): string {
  const now = new Date()
  const past = new Date(now.getTime() - Math.random() * monthsBack * 30 * 24 * 60 * 60 * 1000)
  return past.toISOString()
}

function randomDateInMonth(monthOffset: number): string {
  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
  const day = Math.floor(Math.random() * 28) + 1
  target.setDate(day)
  return target.toISOString()
}

async function seedDataForUser(userId: string) {
  // Create expenses (6 months of data)
  const expenses = []
  for (let month = 0; month < 6; month++) {
    const numExpenses = Math.floor(Math.random() * 8) + 10
    for (let i = 0; i < numExpenses; i++) {
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
      const titles = EXPENSE_TITLES[category]
      const title = titles[Math.floor(Math.random() * titles.length)]
      let amount = randomBetween(5, 200)

      if (category === 'Rent') amount = randomBetween(1200, 2200)
      else if (category === 'Investments') amount = randomBetween(100, 1000)
      else if (category === 'Insurance') amount = randomBetween(50, 300)
      else if (category === 'Subscriptions') amount = randomBetween(9.99, 49.99)
      else if (category === 'Healthcare') amount = randomBetween(20, 500)
      else if (category === 'Education') amount = randomBetween(15, 200)

      expenses.push({
        id: randomUUID(),
        userId,
        title,
        amount,
        category,
        date: randomDateInMonth(month),
        description: `${title} expense`,
        isRecurring: ['Rent', 'Subscriptions', 'Insurance', 'Utilities'].includes(category),
      })
    }
  }

  await db.expense.createMany({ data: expenses })

  // Create incomes (6 months)
  const incomes = []
  for (let month = 0; month < 6; month++) {
    // Salary (always)
    incomes.push({
      id: randomUUID(),
      userId,
      title: 'Monthly Salary',
      amount: randomBetween(5500, 7500),
      source: 'Salary',
      date: randomDateInMonth(month),
      isRecurring: true,
    })
    // Additional income (50% chance)
    if (Math.random() > 0.5) {
      const source = INCOME_SOURCES[Math.floor(Math.random() * (INCOME_SOURCES.length - 1)) + 1]
      incomes.push({
        id: randomUUID(),
        userId,
        title: `${source} Payment`,
        amount: randomBetween(200, 3000),
        source,
        date: randomDateInMonth(month),
        isRecurring: Math.random() > 0.6,
      })
    }
  }

  await db.income.createMany({ data: incomes })

  // Create budgets
  const budgetCategories = ['Food', 'Shopping', 'Entertainment', 'Transportation', 'Utilities', 'Subscriptions', 'Healthcare']
  const budgets = budgetCategories.map((category) => {
    const limit = category === 'Food' ? 800 :
      category === 'Shopping' ? 500 :
      category === 'Entertainment' ? 200 :
      category === 'Transportation' ? 300 :
      category === 'Utilities' ? 400 :
      category === 'Subscriptions' ? 100 : 300

    const spent = randomBetween(limit * 0.3, limit * 0.95)

    return {
      id: randomUUID(),
      userId,
      category,
      limit,
      spent,
      period: 'monthly',
      startDate: new Date().toISOString(),
    }
  })

  await db.budget.createMany({ data: budgets })

  // Create goals
  const goalsData = [
    { title: 'Emergency Fund', targetAmount: 15000, currentAmount: 8750, icon: '🛡️', color: '#10b981', deadline: '2025-12-31' },
    { title: 'New MacBook Pro', targetAmount: 2499, currentAmount: 1650, icon: '💻', color: '#06b6d4', deadline: '2025-09-01' },
    { title: 'Japan Vacation', targetAmount: 5000, currentAmount: 2800, icon: '✈️', color: '#f59e0b', deadline: '2026-03-01' },
    { title: 'Investment Portfolio', targetAmount: 50000, currentAmount: 22000, icon: '📈', color: '#8b5cf6', deadline: '2026-12-31' },
    { title: 'Car Down Payment', targetAmount: 10000, currentAmount: 4200, icon: '🚗', color: '#f43f5e', deadline: '2026-06-01' },
  ]

  await db.goal.createMany({
    data: goalsData.map(g => ({
      id: randomUUID(),
      userId,
      ...g,
      deadline: g.deadline ? new Date(g.deadline).toISOString() : null,
    })),
  })

  return { expenses: expenses.length, incomes: incomes.length, budgets: budgets.length, goals: goalsData.length }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { userId, name, email } = body as { userId?: string; name?: string; email?: string }

    // If a userId is provided, seed data for that existing user only
    if (userId) {
      const stats = await seedDataForUser(userId)
      return NextResponse.json({ success: true, stats })
    }

    // Legacy behavior: no userId provided — create demo@finwise.ai
    const existingUser = await db.user.findFirst()
    if (existingUser) {
      // Clear existing data for fresh seed
      await db.chatMessage.deleteMany()
      await db.expense.deleteMany()
      await db.income.deleteMany()
      await db.goal.deleteMany()
      await db.budget.deleteMany()
      await db.user.deleteMany()
    }

    // Create demo user
    const newUserId = randomUUID()
    const user = await db.user.create({
      data: {
        id: newUserId,
        email: 'demo@finwise.ai',
        name: 'Alex Morgan',
        passwordHash: Buffer.from('demo123').toString('base64'),
        currency: 'USD',
      },
    })

    const stats = await seedDataForUser(user.id)

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, currency: user.currency },
      stats,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}
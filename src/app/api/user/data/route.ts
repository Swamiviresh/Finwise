import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = join(process.cwd(), 'uploads')

/**
 * Clear ALL user data including:
 * - Uploaded files (physical + DB records)
 * - All transactions (expenses, incomes)
 * - Budgets, goals, wallets
 * - Chat messages, notes
 * - Categories, tags
 * - The user account itself
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Delete physical uploaded files first
    const files = await db.uploadedFile.findMany({
      where: { userId },
      select: { filePath: true },
    })

    for (const file of files) {
      const fullPath = join(UPLOAD_DIR, file.filePath)
      if (existsSync(fullPath)) {
        await unlink(fullPath).catch(() => {})
      }
    }

    // Delete the user (cascade will handle all related records)
    await db.user.delete({ where: { id: userId } })

    return NextResponse.json({
      success: true,
      message: 'All your data has been permanently deleted.',
    })
  } catch (error) {
    console.error('Delete user data error:', error)
    return NextResponse.json({ error: 'Failed to delete user data' }, { status: 500 })
  }
}
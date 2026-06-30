import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { unlink, readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = join(process.cwd(), 'uploads')

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const files = await db.uploadedFile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        rowCount: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ files })
  } catch (error) {
    console.error('List files error:', error)
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Get all files for this user
    const files = await db.uploadedFile.findMany({
      where: { userId },
      select: { filePath: true },
    })

    // Delete physical files
    for (const file of files) {
      const fullPath = join(UPLOAD_DIR, file.filePath)
      if (existsSync(fullPath)) {
        await unlink(fullPath).catch(() => {})
      }
    }

    // Delete file records from DB (transactions are kept!)
    await db.uploadedFile.deleteMany({ where: { userId } })

    return NextResponse.json({
      success: true,
      message: `Cleared ${files.length} uploaded files. Your transactions are preserved.`,
    })
  } catch (error) {
    console.error('Clear files error:', error)
    return NextResponse.json({ error: 'Failed to clear files' }, { status: 500 })
  }
}
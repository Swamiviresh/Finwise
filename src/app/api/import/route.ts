import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface CsvRow {
  type: string
  title: string
  amount: number
  category: string
  source: string
  date: string
  description: string
  isRecurring: boolean
  errors: string[]
}

function detectDelimiter(firstLine: string): string {
  const semicolons = (firstLine.match(/;/g) || []).length
  const commas = (firstLine.match(/,/g) || []).length
  return semicolons > commas ? ';' : ','
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"' && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === delimiter) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }
  result.push(current.trim())
  return result
}

function parseBoolean(val: string): boolean {
  const lower = val.toLowerCase().trim()
  return lower === 'true' || lower === 'yes' || lower === '1'
}

function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateStr)) return false
  const d = new Date(dateStr + 'T00:00:00.000Z')
  return !isNaN(d.getTime())
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a .csv file' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 5MB' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must have a header row and at least one data row' }, { status: 400 })
    }

    // Auto-detect delimiter from header line
    const delimiter = detectDelimiter(lines[0])
    const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader)

    // Map normalized headers to expected field names
    const headerMap: Record<string, number> = {}
    const expectedFields = ['type', 'title', 'amount', 'category', 'source', 'date', 'description', 'isrecurring']

    headers.forEach((h, i) => {
      if (expectedFields.includes(h)) {
        headerMap[h] = i
      }
    })

    // Check for required fields
    const requiredFields = ['title', 'amount', 'date']
    const missingFields = requiredFields.filter(f => headerMap[f] === undefined)
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required CSV columns: ${missingFields.join(', ')}. Expected columns: type, title, amount, category, source, date, description, isRecurring` },
        { status: 400 },
      )
    }

    // If no type column, infer from context (we need it)
    // If type is missing, we'll check if category or source is present to infer
    const hasType = headerMap['type'] !== undefined

    // Parse data rows
    const rows: CsvRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i], delimiter)
      const row: CsvRow = {
        type: hasType ? (values[headerMap['type']] || '').toLowerCase().trim() : '',
        title: (values[headerMap['title']] || '').trim(),
        amount: parseFloat((values[headerMap['amount']] || '0').replace(/[^0-9.\-]/g, '')),
        category: headerMap['category'] !== undefined ? (values[headerMap['category']] || '').trim() : '',
        source: headerMap['source'] !== undefined ? (values[headerMap['source']] || '').trim() : '',
        date: (values[headerMap['date']] || '').trim(),
        description: headerMap['description'] !== undefined ? (values[headerMap['description']] || '').trim() : '',
        isRecurring: headerMap['isrecurring'] !== undefined ? parseBoolean(values[headerMap['isrecurring']] || 'false') : false,
        errors: [],
      }
      rows.push(row)
    }

    // Validate rows
    let createdCount = 0
    let skippedCount = 0
    const errors: { row: number; errors: string[] }[] = []

    const validExpenseRows: CsvRow[] = []
    const validIncomeRows: CsvRow[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowErrors: string[] = []

      // Validate type
      if (!hasType) {
        // Infer from category/source presence
        if (row.category && !row.source) {
          row.type = 'expense'
        } else if (row.source && !row.category) {
          row.type = 'income'
        } else if (row.category && row.source) {
          rowErrors.push('Cannot determine type when both category and source are provided without a type column')
        } else {
          rowErrors.push('Cannot determine type: provide a type column, or category (expense) or source (income)')
        }
      } else if (row.type !== 'expense' && row.type !== 'income') {
        rowErrors.push(`Invalid type "${row.type}" - must be "expense" or "income"`)
      }

      // Validate title
      if (!row.title) {
        rowErrors.push('Title is required')
      }

      // Validate amount
      if (isNaN(row.amount) || row.amount <= 0) {
        rowErrors.push('Amount must be a positive number')
      }

      // Validate date
      if (!isValidDate(row.date)) {
        rowErrors.push('Date must be in YYYY-MM-DD format')
      }

      if (row.type === 'expense' && !row.category) {
        rowErrors.push('Category is required for expenses')
      }

      if (row.type === 'income' && !row.source) {
        rowErrors.push('Source is required for incomes')
      }

      if (rowErrors.length > 0) {
        errors.push({ row: i + 2, errors: rowErrors })
        skippedCount++
      } else if (row.type === 'expense') {
        validExpenseRows.push(row)
      } else if (row.type === 'income') {
        validIncomeRows.push(row)
      }
    }

    // Create expense records
    for (const row of validExpenseRows) {
      try {
        await db.expense.create({
          data: {
            userId,
            title: row.title,
            amount: row.amount,
            category: row.category,
            date: new Date(row.date + 'T00:00:00.000Z'),
            description: row.description || undefined,
            isRecurring: row.isRecurring,
          },
        })
        createdCount++
      } catch (err) {
        console.error('Failed to create expense:', err)
        skippedCount++
        errors.push({ row: 0, errors: [`Failed to create expense "${row.title}": ${err instanceof Error ? err.message : 'Unknown error'}`] })
      }
    }

    // Create income records
    for (const row of validIncomeRows) {
      try {
        await db.income.create({
          data: {
            userId,
            title: row.title,
            amount: row.amount,
            source: row.source,
            date: new Date(row.date + 'T00:00:00.000Z'),
            isRecurring: row.isRecurring,
          },
        })
        createdCount++
      } catch (err) {
        console.error('Failed to create income:', err)
        skippedCount++
        errors.push({ row: 0, errors: [`Failed to create income "${row.title}": ${err instanceof Error ? err.message : 'Unknown error'}`] })
      }
    }

    return NextResponse.json({
      success: true,
      created: createdCount,
      skipped: skippedCount,
      total: rows.length,
      errors,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Failed to process import' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink, readdir, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'

const UPLOAD_DIR = join(process.cwd(), 'uploads')

interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: 'credit' | 'debit'
  category?: string
}

/**
 * Privacy filter: strips sensitive info from transaction descriptions
 * before any processing or AI categorization.
 */
function stripSensitiveFromDescription(desc: string): string {
  return desc
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{0,4}\b/g, '[REDACTED]')
    .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, '[REDACTED]')
    .replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, '[REDACTED]')
    .replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g, '[REDACTED]')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED]')
    .replace(/\b[A-Z]{4}0[A-Z0-9]{6}\b/g, '[REDACTED]')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z]{2,}\b/g, '[REDACTED]')
}

/**
 * Standard category mapping based on keywords
 */
function autoCategorize(description: string): string {
  const desc = description.toLowerCase()
  const categories: [string[], string][] = [
    [['food', 'restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'pizza', 'burger', 'swiggy', 'zomato', 'uber eats', 'doordash', 'grubhub', 'grocery', 'bigbasket', 'blinkit', 'dunzo', 'freshdirect', 'walmart', 'target'], 'Food'],
    [['rent', 'housing', 'mortgage', 'property', 'lease'], 'Rent'],
    [['shopping', 'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'etsy', 'ebay', 'alibaba', 'shein', 'nordstrom', 'macys', 'clothing', 'apparel'], 'Shopping'],
    [['hospital', 'doctor', 'pharmacy', 'medical', 'health', 'dental', 'clinic', 'apollo', 'practo', '1mg', 'netmeds', 'cvs', 'walgreens'], 'Healthcare'],
    [['education', 'school', 'college', 'university', 'tuition', 'udemy', 'coursera', 'skillshare', 'book', 'library', 'byju', 'unacademy'], 'Education'],
    [['uber', 'lyft', 'ola', 'rapido', 'metro', 'bus', 'train', 'flight', 'airline', 'irctc', 'makemytrip', 'cleartrip', 'gas', 'petrol', 'fuel', 'parking', 'toll'], 'Transportation'],
    [['movie', 'netflix', 'spotify', 'hotstar', 'prime video', 'disney', 'hbo', 'hulu', 'concert', 'game', 'playstation', 'xbox', 'steam', 'entertainment', 'pvr', 'inox', 'bookmyshow'], 'Entertainment'],
    [['electric', 'water', 'gas bill', 'internet', 'wifi', 'phone', 'mobile', 'recharge', 'bill payment', 'utility', 'bses', 'tata power', 'jio', 'airtel', 'vodafone', 'comcast', 'at&t', 'verizon'], 'Utilities'],
    [['invest', 'stock', 'mutual fund', 'etf', 'crypto', 'bitcoin', 'trading', 'zerodha', 'groww', 'coinbase', 'robinhood', 'fidelity', 'vanguard', 'sip'], 'Investments'],
    [['insurance', 'policy', 'premium', 'lic', 'term plan', 'health ins'], 'Insurance'],
    [['subscription', 'membership', 'gym', 'linkedin', 'youtube premium', 'icloud', 'adobe', 'microsoft', 'github', 'notion', 'slack', 'zoom'], 'Subscriptions'],
    [['salary', 'payroll', 'wage', 'income', 'freelance', 'consulting', 'dividend', 'interest', 'refund', 'cashback', 'credit'], 'Income'],
  ]

  for (const [keywords, category] of categories) {
    if (keywords.some(kw => desc.includes(kw))) {
      return category === 'Income' ? 'Income' : category
    }
  }
  return 'Others'
}

/**
 * Parse CSV text into transactions
 */
function parseCSV(csvText: string): ParsedTransaction[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim())
  if (lines.length < 2) return []

  // Detect delimiter
  const firstLine = lines[0]
  const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ','

  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/['"]/g, ''))

  // Find column indices
  const dateIdx = headers.findIndex(h => /^(date|transaction.?date|trans.?date|value.?date|posting.?date|txn.?date)$/i.test(h))
  const descIdx = headers.findIndex(h => /^(description|narration|particulars|details|memo|transaction.?details|remarks|merchant|payee)$/i.test(h))
  const amountIdx = headers.findIndex(h => /^(amount|debit|withdrawal|spent|debit.?amount|withdrawal.?amt)$/i.test(h))
  const creditIdx = headers.findIndex(h => /^(credit|deposit|income|credit.?amount|deposit.?amt)$/i.test(h))
  const balanceIdx = headers.findIndex(h => /^(balance|closing.?balance|available.?balance|running.?balance)$/i.test(h))
  const typeIdx = headers.findIndex(h => /^(type|transaction.?type|dr.?cr|debit.?credit)$/i.test(h))

  const transactions: ParsedTransaction[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.trim().replace(/['"]/g, ''))
    if (cols.length < 2) continue

    // Extract date
    let dateStr = dateIdx >= 0 ? cols[dateIdx] : cols[0]
    if (!dateStr) continue

    const parsedDate = parseDate(dateStr)
    if (!parsedDate) continue

    // Extract description
    let description = descIdx >= 0 ? cols[descIdx] : ''
    if (!description) {
      // Try to find a text column
      for (let j = 0; j < cols.length; j++) {
        if (j !== dateIdx && j !== amountIdx && j !== creditIdx && j !== balanceIdx && j !== typeIdx) {
          const val = cols[j]
          if (val && isNaN(Number(val.replace(/[,₹$€£]/g, ''))) && val.length > 2) {
            description = val
            break
          }
        }
      }
    }
    description = stripSensitiveFromDescription(description)
    if (!description) continue

    // Extract amount
    let amount = 0
    let type: 'credit' | 'debit' = 'debit'

    if (amountIdx >= 0 && creditIdx >= 0) {
      const debitAmt = parseAmount(cols[amountIdx])
      const creditAmt = parseAmount(cols[creditIdx])
      if (creditAmt > 0) {
        amount = creditAmt
        type = 'credit'
      } else {
        amount = debitAmt
        type = 'debit'
      }
    } else if (amountIdx >= 0) {
      amount = parseAmount(cols[amountIdx])
      // Check if there's a type column
      if (typeIdx >= 0) {
        const typeVal = cols[typeIdx]?.toLowerCase()
        if (typeVal?.includes('cr') || typeVal?.includes('credit') || typeVal?.includes('income')) {
          type = 'credit'
        }
      } else if (amount < 0) {
        amount = Math.abs(amount)
        type = 'credit'
      }
    } else {
      // Try to find any amount-like column
      for (let j = 0; j < cols.length; j++) {
        if (j !== dateIdx && j !== descIdx && j !== balanceIdx) {
          const val = parseAmount(cols[j])
          if (val > 0) {
            amount = val
            break
          }
        }
      }
    }

    if (amount <= 0) continue

    transactions.push({
      date: parsedDate,
      description,
      amount,
      type,
      category: autoCategorize(description),
    })
  }

  return transactions
}

function parseAmount(str: string): number {
  if (!str) return 0
  return Math.abs(Number(str.replace(/[,₹$€£\s]/g, ''))) || 0
}

function parseDate(str: string): string | null {
  if (!str) return null
  // Try various date formats
  const cleaned = str.replace(/['"]/g, '').trim()

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/)
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1])
    const m = parseInt(dmyMatch[2]) - 1
    let y = parseInt(dmyMatch[3])
    if (y < 100) y += 2000
    const date = new Date(y, m, d)
    if (!isNaN(date.getTime())) return date.toISOString()
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = cleaned.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/)
  if (ymdMatch) {
    const date = new Date(parseInt(ymdMatch[1]), parseInt(ymdMatch[2]) - 1, parseInt(ymdMatch[3]))
    if (!isNaN(date.getTime())) return date.toISOString()
  }

  // MM/DD/YYYY (US format)
  const mdyMatch = cleaned.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})$/)
  if (mdyMatch) {
    const date = new Date(parseInt(mdyMatch[3]), parseInt(mdyMatch[1]) - 1, parseInt(mdyMatch[2]))
    if (!isNaN(date.getTime())) return date.toISOString()
  }

  // Try native date parsing as fallback
  const date = new Date(cleaned)
  if (!isNaN(date.getTime())) return date.toISOString()

  return null
}

/**
 * Parse Excel file buffer into transactions
 */
function parseExcel(buffer: ArrayBuffer): ParsedTransaction[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  const sheet = workbook.Sheets[sheetName]
  const csvText = XLSX.utils.sheet_to_csv(sheet)
  return parseCSV(csvText)
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!file || !userId) {
      return NextResponse.json({ error: 'File and userId are required' }, { status: 400 })
    }

    // Validate file type
    const validTypes = [
      'text/csv', 'application/csv', 'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/x-csv', 'text/x-csv', 'text/plain',
    ]
    const validExtensions = ['.csv', '.xls', '.xlsx', '.tsv']
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      return NextResponse.json({ error: 'Please upload a CSV or Excel file (.csv, .xls, .xlsx)' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 })
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // Save file to disk
    const fileExt = ext || '.csv'
    const uniqueName = `${userId}_${Date.now()}${fileExt}`
    const filePath = join(UPLOAD_DIR, uniqueName)
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    // Parse transactions
    let transactions: ParsedTransaction[] = []
    if (fileExt === '.csv' || fileExt === '.tsv') {
      const text = new TextDecoder().decode(bytes)
      transactions = parseCSV(text)
    } else {
      transactions = parseExcel(bytes)
    }

    if (transactions.length === 0) {
      // Clean up file if no transactions found
      await unlink(filePath).catch(() => {})
      return NextResponse.json({ error: 'No transactions could be parsed from this file. Please check the format. Expected columns: Date, Description, Amount (and optionally Credit/Debit columns).' }, { status: 400 })
    }

    // Create expense/income records in DB
    let expenseCount = 0
    let incomeCount = 0

    for (const txn of transactions) {
      if (txn.type === 'credit' || txn.category === 'Income') {
        await db.income.create({
          data: {
            userId,
            title: txn.description.slice(0, 100),
            amount: txn.amount,
            source: txn.category,
            date: new Date(txn.date),
            isRecurring: false,
          },
        })
        incomeCount++
      } else {
        await db.expense.create({
          data: {
            userId,
            title: txn.description.slice(0, 100),
            amount: txn.amount,
            category: txn.category,
            date: new Date(txn.date),
            description: txn.description.slice(0, 200),
            isRecurring: false,
          },
        })
        expenseCount++
      }
    }

    // Save file record
    await db.uploadedFile.create({
      data: {
        userId,
        fileName: file.name,
        fileType: fileExt,
        fileSize: file.size,
        filePath: uniqueName,
        rowCount: transactions.length,
      },
    })

    return NextResponse.json({
      success: true,
      transactions: transactions.length,
      expenses: expenseCount,
      incomes: incomeCount,
      message: `Successfully imported ${transactions.length} transactions (${expenseCount} expenses, ${incomeCount} incomes)`,
    })
  } catch (error) {
    console.error('Statement upload error:', error)
    return NextResponse.json({ error: 'Failed to process file. Please ensure it has Date, Description, and Amount columns.' }, { status: 500 })
  }
}
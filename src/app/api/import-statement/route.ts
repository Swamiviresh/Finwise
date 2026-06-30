import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Common bank statement column header patterns
const DATE_PATTERNS = /^(date|transactiondate|txn.?date|postingdate|value.?date|transdate|dt|on)$/i
const DESC_PATTERNS = /^(description|narration|particulars|details|memo|transaction.?details|remarks|reference|description2?|payee|merchant|transaction)$/i
const DEBIT_PATTERNS = /^(debit|withdrawal|debitamount|withdrawalamount|dr|debit\s*amt|paid|out|spend|expense)$/i
const CREDIT_PATTERNS = /^(credit|deposit|creditamount|depositamount|cr|credit\s*amt|received|in|income)$/i

const CATEGORY_KEYWORDS: Record<string, string> = {
  'swiggy': 'Food', 'zomato': 'Food', 'uber eats': 'Food', 'dominos': 'Food', 'pizza': 'Food',
  'restaurant': 'Food', 'cafe': 'Food', 'coffee': 'Food', 'starbucks': 'Food', 'mcdonald': 'Food',
  'kfc': 'Food', 'bakery': 'Food', 'grocery': 'Food', 'bigbasket': 'Food', 'blinkit': 'Food',
  'dmart': 'Food', 'food': 'Food', 'dining': 'Food', 'lunch': 'Food', 'dinner': 'Food',
  'uber': 'Transportation', 'ola': 'Transportation', 'rapido': 'Transportation', 'metro': 'Transportation',
  'petrol': 'Transportation', 'fuel': 'Transportation', 'parking': 'Transportation', 'toll': 'Transportation',
  'amazon': 'Shopping', 'flipkart': 'Shopping', 'myntra': 'Shopping', 'ajio': 'Shopping',
  'nykaa': 'Shopping', 'shopping': 'Shopping', 'mall': 'Shopping', 'store': 'Shopping',
  'netflix': 'Entertainment', 'spotify': 'Entertainment', 'hotstar': 'Entertainment',
  'disney': 'Entertainment', 'prime video': 'Entertainment', 'youtube': 'Entertainment',
  'movie': 'Entertainment', 'gaming': 'Entertainment', 'steam': 'Entertainment',
  'electricity': 'Utilities', 'water': 'Utilities', 'gas bill': 'Utilities',
  'internet': 'Utilities', 'broadband': 'Utilities', 'jiofiber': 'Utilities',
  'airtel': 'Utilities', 'vodafone': 'Utilities', 'phone': 'Utilities', 'mobile': 'Utilities',
  'recharge': 'Utilities', 'hospital': 'Healthcare', 'pharmacy': 'Healthcare',
  'doctor': 'Healthcare', 'medical': 'Healthcare', 'clinic': 'Healthcare',
  'apollo': 'Healthcare', '1mg': 'Healthcare', 'health': 'Healthcare', 'dental': 'Healthcare',
  'gym': 'Healthcare', 'coursera': 'Education', 'udemy': 'Education', 'university': 'Education',
  'college': 'Education', 'school': 'Education', 'tuition': 'Education', 'education': 'Education',
  'subscription': 'Subscriptions', 'membership': 'Subscriptions',
  'insurance': 'Insurance', 'policy': 'Insurance', 'premium': 'Insurance',
  'rent': 'Rent', 'housing': 'Rent', 'flat': 'Rent',
  'mutual fund': 'Investments', 'sip': 'Investments', 'stock': 'Investments',
  'zerodha': 'Investments', 'groww': 'Investments', 'trading': 'Investments',
  'emi': 'Others', 'loan': 'Others', 'transfer': 'Others', 'neft': 'Others', 'rtgs': 'Others',
  'upi': 'Others', 'imps': 'Others',
}

function detectDelimiter(firstLine: string): string {
  const semicolons = (firstLine.match(/;/g) || []).length
  const commas = (firstLine.match(/,/g) || []).length
  const tabs = (firstLine.match(/\t/g) || []).length
  if (tabs > commas && tabs > semicolons) return '\t'
  return semicolons > commas ? ';' : ','
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"' && i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++ }
      else if (char === '"') inQuotes = false
      else current += char
    } else {
      if (char === '"') inQuotes = true
      else if (char === delimiter) { result.push(current.trim()); current = '' }
      else current += char
    }
  }
  result.push(current.trim())
  return result
}

function matchHeader(header: string, patterns: RegExp): boolean {
  return patterns.test(header.replace(/[^a-z]/gi, '').toLowerCase())
}

function detectColumnMappings(headers: string[]) {
  let dateIdx = -1, descIdx = -1, debitIdx = -1, creditIdx = -1, balanceIdx = -1, amountIdx = -1
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i]
    if (dateIdx === -1 && matchHeader(h, DATE_PATTERNS)) dateIdx = i
    else if (descIdx === -1 && matchHeader(h, DESC_PATTERNS)) descIdx = i
    else if (debitIdx === -1 && matchHeader(h, DEBIT_PATTERNS) && !matchHeader(h, CREDIT_PATTERNS)) debitIdx = i
    else if (creditIdx === -1 && matchHeader(h, CREDIT_PATTERNS) && !matchHeader(h, DEBIT_PATTERNS)) creditIdx = i
    else if (balanceIdx === -1 && /balance|running/.test(h.replace(/[^a-z]/gi, '').toLowerCase())) balanceIdx = i
    else if (amountIdx === -1 && /amount/.test(h.replace(/[^a-z]/gi, '').toLowerCase()) && debitIdx === -1 && creditIdx === -1) amountIdx = i
  }
  if (dateIdx === -1 && headers.length >= 3) dateIdx = 0
  if (descIdx === -1 && dateIdx >= 0 && headers.length >= 3) descIdx = dateIdx + 1
  return { dateIdx, descIdx, debitIdx, creditIdx, balanceIdx, amountIdx, singleAmountCol: debitIdx === -1 && creditIdx === -1 && amountIdx !== -1 }
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null
  const cleaned = dateStr.replace(/["']/g, '').trim()
  let m = cleaned.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/)
  if (m) {
    let [, d, mo, y] = m
    if (y.length === 2) y = '20' + y
    const date = new Date(`${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00.000Z`)
    if (!isNaN(date.getTime())) return date.toISOString()
  }
  m = cleaned.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})$/)
  if (m) {
    const date = new Date(`${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}T00:00:00.000Z`)
    if (!isNaN(date.getTime())) return date.toISOString()
  }
  const parsed = new Date(cleaned)
  if (!isNaN(parsed.getTime())) return parsed.toISOString()
  return null
}

function autoCategorize(description: string): string {
  const lower = description.toLowerCase()
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) return category
  }
  return 'Others'
}

function parseAmount(val: string): number {
  if (!val) return 0
  return parseFloat(val.replace(/[^0-9.\-]/g, '')) || 0
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null
    const action = formData.get('action') as string | null
    const transactions = formData.get('transactions') as string | null

    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })

    if (action === 'confirm' && transactions) {
      const rows: Array<{ type: string; title: string; amount: number; category: string; date: string }> = JSON.parse(transactions)
      let created = 0
      for (const row of rows) {
        try {
          if (row.type === 'expense') {
            await db.expense.create({ data: { userId, title: row.title, amount: row.amount, category: row.category, date: new Date(row.date), description: 'Imported from bank statement', isRecurring: false } })
          } else {
            await db.income.create({ data: { userId, title: row.title, amount: row.amount, source: row.category, date: new Date(row.date), isRecurring: false } })
          }
          created++
        } catch (err) { console.error('Failed to import row:', err) }
      }
      return NextResponse.json({ success: true, created, total: rows.length })
    }

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
    if (lines.length < 2) return NextResponse.json({ error: 'File must have a header and data rows' }, { status: 400 })

    const delimiter = detectDelimiter(lines[0])
    const headers = parseCsvLine(lines[0], delimiter)
    const mapping = detectColumnMappings(headers)

    if (mapping.dateIdx === -1) return NextResponse.json({ error: `Could not detect a Date column. Found: ${headers.join(', ')}` }, { status: 400 })
    if (mapping.descIdx === -1) return NextResponse.json({ error: `Could not detect a Description column. Found: ${headers.join(', ')}` }, { status: 400 })
    if (mapping.debitIdx === -1 && mapping.creditIdx === -1 && mapping.amountIdx === -1) return NextResponse.json({ error: `Could not detect Debit/Credit/Amount columns. Found: ${headers.join(', ')}` }, { status: 400 })

    const detected: Array<{ type: string; title: string; amount: number; category: string; date: string; rawDesc: string }> = []
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i], delimiter)
      if (values.length < 2) continue
      const desc = mapping.descIdx >= 0 ? (values[mapping.descIdx] || '').trim() : ''
      const dateStr = mapping.dateIdx >= 0 ? (values[mapping.dateIdx] || '').trim() : ''
      const debit = mapping.debitIdx >= 0 ? parseAmount(values[mapping.debitIdx]) : 0
      const credit = mapping.creditIdx >= 0 ? parseAmount(values[mapping.creditIdx]) : 0
      const amount = mapping.amountIdx >= 0 ? parseAmount(values[mapping.amountIdx]) : 0
      const date = parseDate(dateStr)
      if (!date || !desc) continue
      if (debit === 0 && credit === 0 && amount === 0) continue

      let type: string, finalAmount: number
      if (mapping.singleAmountCol) { type = amount < 0 ? 'expense' : 'income'; finalAmount = Math.abs(amount) }
      else if (debit > 0) { type = 'expense'; finalAmount = debit }
      else if (credit > 0) { type = 'income'; finalAmount = credit }
      else continue

      detected.push({ type, title: desc, amount: finalAmount, category: autoCategorize(desc), date, rawDesc: desc })
    }
    if (detected.length === 0) return NextResponse.json({ error: 'No valid transactions found. Ensure columns for Date, Description, and Debit/Credit.' }, { status: 400 })

    return NextResponse.json({
      success: true, action: 'preview', headers, total: detected.length,
      expenses: detected.filter(r => r.type === 'expense').length,
      income: detected.filter(r => r.type === 'income').length,
      preview: detected.slice(0, 10),
      allTransactions: detected,
    })
  } catch (error) {
    console.error('Statement import error:', error)
    return NextResponse.json({ error: 'Failed to process bank statement' }, { status: 500 })
  }
}

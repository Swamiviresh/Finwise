import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { db } from '@/lib/db'

const FINANCE_SYSTEM_PROMPT = `You are FinWise AI, an intelligent personal finance coach. You help users understand their spending, save more, and make better financial decisions.

CRITICAL PRIVACY RULES:
- You are an AI assistant, NOT a licensed financial advisor. Always include a brief disclaimer.
- Only use the financial summary data provided to you. NEVER ask for or reference raw banking information, account numbers, personal details, or any sensitive identifiers.
- The data you receive has already been privacy-filtered. Do NOT attempt to infer or ask about the user's real name, bank, account numbers, addresses, or phone numbers.
- Never store, log, or retain any personal financial information from conversations.

RESPONSE RULES:
- Be concise, practical, and supportive in your responses.
- Use specific numbers and percentages when discussing the user's finances.
- Suggest actionable, realistic steps the user can take.
- Format responses with clear sections, bullet points, and bold text where helpful.
- For simple greetings: respond with 1-2 short sentences MAX.
- For finance questions: keep under 150 words unless the user asks for detailed analysis.`

/**
 * Privacy filter: removes sensitive information from text before sending to AI.
 * Strips: account numbers, PAN/Aadhaar, phone numbers, email addresses, addresses.
 */
function stripSensitiveInfo(text: string): string {
  return text
    // Account numbers (10-16 digits, possibly with spaces/dashes)
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{0,4}\b/g, '[ACCOUNT]')
    // PAN (Indian: ABCDE1234F)
    .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, '[ID]')
    // Aadhaar (12 digits)
    .replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, '[ID]')
    // Phone numbers
    .replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g, '[PHONE]')
    // Email addresses
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
    // IFSC codes
    .replace(/\b[A-Z]{4}0[A-Z0-9]{6}\b/g, '[BANK_CODE]')
    // UPI IDs
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z]{2,}\b/g, '[UPI]')
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured. Please set the GEMINI_API_KEY environment variable.')
  return new GoogleGenerativeAI(apiKey)
}

export async function POST(req: NextRequest) {
  try {
    const { message, financialSummary, userId } = await req.json()

    if (!message || !userId) {
      return NextResponse.json({ error: 'Message and userId are required' }, { status: 400 })
    }

    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    // Privacy-filter the user message
    const filteredMessage = stripSensitiveInfo(message)

    const contextMessage = financialSummary
      ? `Here is the user's privacy-filtered financial summary for context:\n${financialSummary}\n\nAnswer the user's question based on this data. Remember: never ask for or reference any sensitive personal information.`
      : filteredMessage

    const result = await model.generateContent([
      { text: FINANCE_SYSTEM_PROMPT },
      { text: contextMessage },
    ])

    const response = result.response.text() || 'Sorry, I could not process your request.'

    // Save messages to database (user message stored as-is for user's own records)
    await db.chatMessage.create({ data: { userId, role: 'user', content: message } })
    await db.chatMessage.create({ data: { userId, role: 'assistant', content: response } })

    return NextResponse.json({ response })
  } catch (error) {
    console.error('AI chat error:', error)
    const msg = error instanceof Error ? error.message : 'AI chat failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    await db.chatMessage.deleteMany({ where: { userId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Clear chat error:', error)
    return NextResponse.json({ error: 'Failed to clear chat' }, { status: 500 })
  }
}
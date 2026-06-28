import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

const FINANCE_SYSTEM_PROMPT = `You are FinWise AI, an intelligent personal finance coach. You help users understand their spending, save more, and make better financial decisions.

CRITICAL RULES:
- You are an AI assistant, NOT a licensed financial advisor. Always include a brief disclaimer.
- Only use the financial summary data provided to you. NEVER access or reference raw banking information.
- Be concise, practical, and supportive in your responses.
- Use specific numbers and percentages when discussing the user's finances.
- Suggest actionable, realistic steps the user can take.
- Format responses with clear sections, bullet points, and bold text where helpful.
- Keep responses focused and under 200 words unless the user asks for detailed analysis.
- Never store, log, or retain any personal financial information from conversations.`

export async function POST(req: NextRequest) {
  try {
    const { message, financialSummary, userId } = await req.json()

    if (!message || !userId) {
      return NextResponse.json({ error: 'Message and userId are required' }, { status: 400 })
    }

    const zai = await ZAI.create()

    const contextMessage = financialSummary
      ? `Here is the user's current financial summary for context:\n${financialSummary}\n\nAnswer the user's question based on this data.`
      : message

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: FINANCE_SYSTEM_PROMPT },
        { role: 'user', content: contextMessage },
      ],
      thinking: { type: 'disabled' },
    })

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not process your request.'

    // Save messages to database
    await db.chatMessage.createMany({
      data: [
        { userId, role: 'user', content: message },
        { userId, role: 'assistant', content: response },
      ],
    })

    return NextResponse.json({ response })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ error: 'AI chat failed' }, { status: 500 })
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
import { NextRequest, NextResponse } from 'next/server'

// Hardcoded realistic exchange rates (all against USD as reference)
const USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.5,
  JPY: 149.5,
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const base = searchParams.get('base') || 'USD'

  if (!USD_RATES[base]) {
    return NextResponse.json(
      { error: `Unsupported base currency: ${base}` },
      { status: 400 }
    )
  }

  // Convert all rates to be relative to the requested base currency
  const baseToUsd = USD_RATES[base]
  const rates: Record<string, number> = {}
  for (const [currency, usdRate] of Object.entries(USD_RATES)) {
    rates[currency] = Math.round((usdRate / baseToUsd) * 10000) / 10000
  }

  return NextResponse.json({
    base,
    rates,
    updated: '2025-01-15',
  })
}
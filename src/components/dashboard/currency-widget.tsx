'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingUp, Globe } from 'lucide-react'
import CurrencyConverter from '@/components/shared/currency-converter'

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  INR: '🇮🇳',
  JPY: '🇯🇵',
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
}

interface RatesResponse {
  base: string
  rates: Record<string, number>
  updated: string
}

interface CurrencyWidgetProps {
  currentCurrency: string
  balance: number
}

export default function CurrencyWidget({ currentCurrency, balance }: CurrencyWidgetProps) {
  const [rates, setRates] = useState<RatesResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchRates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/currency?base=${currentCurrency}`)
      if (res.ok) {
        const data: RatesResponse = await res.json()
        setRates(data)
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [currentCurrency])

  useEffect(() => {
    fetchRates()
  }, [fetchRates])

  const convert = (targetCode: string): string => {
    if (!rates) return '—'
    const converted = balance * (rates.rates[targetCode] || 0)
    if (targetCode === 'JPY') {
      return `${CURRENCY_SYMBOLS[targetCode]}${Math.round(converted).toLocaleString()}`
    }
    return `${CURRENCY_SYMBOLS[targetCode]}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <Card className="glass border-0 card-depth-1">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-cyan-500/10 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            Currency
          </CardTitle>
          <CurrencyConverter currentCurrency={currentCurrency} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current currency + balance */}
        <div className="flex items-center gap-2.5 px-1">
          <span className="text-lg">{CURRENCY_FLAGS[currentCurrency]}</span>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-tertiary font-medium">Balance in {currentCurrency}</p>
            <p className="text-lg font-bold text-foreground number-tick">
              {CURRENCY_SYMBOLS[currentCurrency]}{balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Converted values */}
        {loading ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          </div>
        ) : rates ? (
          <div className="space-y-1.5">
            {(['USD', 'EUR'] as const).filter(c => c !== currentCurrency).map(code => (
              <div
                key={code}
                className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
              >
                <span className="text-xs font-medium text-secondary flex items-center gap-1.5">
                  <span>{CURRENCY_FLAGS[code]}</span>
                  {code}
                </span>
                <span className="text-xs font-semibold text-foreground number-tick">
                  {convert(code)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
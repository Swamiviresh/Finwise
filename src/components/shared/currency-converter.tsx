'use client'

import { useState, useEffect, useCallback } from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Loader2, ArrowRightLeft } from 'lucide-react'

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

interface CurrencyConverterProps {
  currentCurrency: string
}

export default function CurrencyConverter({ currentCurrency }: CurrencyConverterProps) {
  const [open, setOpen] = useState(false)
  const [rates, setRates] = useState<RatesResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('1000')

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
    if (open) {
      fetchRates()
    }
  }, [open, fetchRates])

  const otherCurrencies = Object.keys(CURRENCY_FLAGS).filter(c => c !== currentCurrency)
  const numAmount = parseFloat(amount) || 0

  const formatAmount = (value: number, currencyCode: string) => {
    if (currencyCode === 'JPY') {
      return Math.round(value).toLocaleString()
    }
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium btn-glass hover-glow-emerald transition-all">
          <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
          Convert
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-4 glass border-0 shadow-2xl"
        align="end"
        sideOffset={8}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>{CURRENCY_FLAGS[currentCurrency]}</span>
              Currency Converter
            </h4>
            {rates && (
              <span className="text-[10px] text-tertiary">Updated {rates.updated}</span>
            )}
          </div>

          {/* Input */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground bg-white/5 rounded-md px-2.5 py-2 shrink-0">
                <span>{CURRENCY_FLAGS[currentCurrency]}</span>
                <span>{currentCurrency}</span>
              </div>
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="h-9 text-sm glass border-0 bg-white/5 number-tick"
                placeholder="Amount"
              />
            </div>
          </div>

          {/* Converted amounts */}
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
            </div>
          ) : rates ? (
            <div className="space-y-1.5">
              {otherCurrencies.map(code => {
                const converted = numAmount * (rates.rates[code] || 0)
                return (
                  <div
                    key={code}
                    className="flex items-center justify-between py-2 px-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                  >
                    <span className="text-xs font-medium text-secondary flex items-center gap-1.5">
                      <span>{CURRENCY_FLAGS[code]}</span>
                      {code}
                    </span>
                    <span className="text-sm font-semibold text-foreground number-tick">
                      {CURRENCY_SYMBOLS[code]}{formatAmount(converted, code)}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-tertiary text-center py-4">Unable to load rates</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
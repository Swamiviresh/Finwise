'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAppStore, type ViewType } from '@/store/use-app-store'

const SHORTCUTS: { keys: string[]; description: string; action?: ViewType }[] = [
  { keys: ['G', 'D'], description: 'Go to Dashboard', action: 'dashboard' },
  { keys: ['G', 'E'], description: 'Go to Expenses', action: 'expenses' },
  { keys: ['G', 'I'], description: 'Go to Income', action: 'income' },
  { keys: ['G', 'B'], description: 'Go to Budgets', action: 'budgets' },
  { keys: ['G', 'G'], description: 'Go to Goals', action: 'goals' },
  { keys: ['G', 'L'], description: 'Go to Bills', action: 'bills' },
  { keys: ['G', 'R'], description: 'Go to Reports', action: 'reports' },
  { keys: ['G', 'A'], description: 'Go to AI Coach', action: 'ai-coach' },
  { keys: ['G', 'S'], description: 'Go to Settings', action: 'settings' },
  { keys: ['/'], description: 'Focus Search' },
  { keys: ['?'], description: 'Open this help' },
  { keys: ['Esc'], description: 'Close dialogs' },
]

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)
  const { setView } = useAppStore()

  useEffect(() => {
    let gBuffer: string | null = null
    let gTimer: ReturnType<typeof setTimeout> | null = null

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Escape closes dialogs
      if (e.key === 'Escape') {
        if (open) {
          setOpen(false)
          return
        }
        return
      }

      // Don't capture shortcuts when typing in inputs
      if (isInput) return

      // ? opens help
      if (e.key === '?') {
        e.preventDefault()
        setOpen(true)
        return
      }

      // G-prefixed navigation
      if (e.key.toLowerCase() === 'g') {
        e.preventDefault()
        if (gTimer) clearTimeout(gTimer)
        gBuffer = 'g'
        gTimer = setTimeout(() => { gBuffer = null }, 600)
        return
      }

      if (gBuffer === 'g') {
        const secondKey = e.key.toLowerCase()
        const match = SHORTCUTS.find(
          s => s.action && s.keys[0].toLowerCase() === 'g' && s.keys[1].toLowerCase() === secondKey
        )
        if (match?.action) {
          e.preventDefault()
          setView(match.action)
          if (gTimer) clearTimeout(gTimer)
          gBuffer = null
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (gTimer) clearTimeout(gTimer)
    }
  }, [open, setView])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="glass border-0 sm:max-w-lg p-0 overflow-hidden">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-lg">Keyboard Shortcuts</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Navigate faster with keyboard shortcuts
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 pb-6 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {SHORTCUTS.map((shortcut) => (
              <div
                key={shortcut.description}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm text-foreground/80">{shortcut.description}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, i) => (
                    <span key={i}>
                      <kbd className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-md bg-foreground/10 border border-foreground/20 text-xs font-mono">
                        {key}
                      </kbd>
                      {i < shortcut.keys.length - 1 && (
                        <span className="text-foreground/30 text-xs mx-0.5">+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
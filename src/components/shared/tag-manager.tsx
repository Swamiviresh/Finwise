'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAppStore, type Tag } from '@/store/use-app-store'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tags, Plus, X, Check } from 'lucide-react'

const COLOR_PRESETS = ['#10b981', '#06b6d4', '#f59e0b', '#f43f5e', '#8b5cf6']

interface TagManagerProps {
  transactionId: string
  transactionType: 'expense' | 'income'
  children: React.ReactNode
}

export default function TagManager({ transactionId, transactionType, children }: TagManagerProps) {
  const { user, tags, setTags } = useAppStore()
  const [currentTags, setCurrentTags] = useState<Tag[]>([])
  const [input, setInput] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0])
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const queryParam = transactionType === 'expense' ? `expenseId=${transactionId}` : `incomeId=${transactionId}`

  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/tags?userId=${user.id}`)
      .then((r) => r.json())
      .then(setTags)
      .catch(() => {})
  }, [user?.id, setTags])

  useEffect(() => {
    if (open && user?.id) {
      fetch(`/api/tags?userId=${user.id}&${queryParam}`)
        .then((r) => r.json())
        .then(setCurrentTags)
        .catch(() => {})
    }
  }, [open, user?.id, queryParam])

  const filteredTags = tags.filter(
    (t) =>
      t.name.toLowerCase().includes(input.toLowerCase()) &&
      !currentTags.some((ct) => ct.id === t.id)
  )

  const showCreateOption = input.trim() && !tags.some((t) => t.name.toLowerCase() === input.trim().toLowerCase())

  const handleToggleTag = async (tagId: string) => {
    try {
      const body: Record<string, string> = { tagId }
      if (transactionType === 'expense') body.expenseId = transactionId
      else body.incomeId = transactionId

      const res = await fetch('/api/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (data.tagged) {
        const newTag = data.transactionTag?.tag
        if (newTag) setCurrentTags((prev) => [...prev, newTag])
        toast.success('Tag added')
      } else {
        const removedTagId = tags.find((t) => t.id === tagId)?.id
        if (removedTagId) setCurrentTags((prev) => prev.filter((t) => t.id !== removedTagId))
        toast.success('Tag removed')
      }
    } catch {
      toast.error('Failed to update tag')
    }
  }

  const handleCreateTag = async () => {
    if (!user?.id || !input.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name: input.trim(), color: selectedColor }),
      })

      if (res.ok) {
        const newTag = await res.json()
        setTags([newTag, ...tags])

        // Auto-apply the tag
        const body: Record<string, string> = { tagId: newTag.id }
        if (transactionType === 'expense') body.expenseId = transactionId
        else body.incomeId = transactionId

        await fetch('/api/tags', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        setCurrentTags((prev) => [...prev, newTag])
        setInput('')
        setCreating(false)
        toast.success(`Tag "${newTag.name}" created and applied`)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create tag')
        setCreating(false)
      }
    } catch {
      toast.error('Failed to create tag')
      setCreating(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side="bottom" align="start" sideOffset={8} className="glass border-0 w-72 p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4 space-y-3"
        >
          {/* Current Tags */}
          {currentTags.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-tertiary font-medium">Active Tags</p>
              <div className="flex flex-wrap gap-1.5">
                <AnimatePresence>
                  {currentTags.map((tag) => (
                    <motion.button
                      key={tag.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => handleToggleTag(tag.id)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors hover:opacity-80"
                      style={{
                        backgroundColor: tag.color + '20',
                        color: tag.color,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                      {tag.name.length > 12 ? tag.name.slice(0, 12) + '…' : tag.name}
                      <X className="w-2.5 h-2.5 opacity-60" />
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Search / Add */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search or create tag..."
                className="glass h-8 text-xs pr-8"
              />
              <Plus className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-tertiary" />
            </div>

            {/* Color presets for new tag */}
            {showCreateOption && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2"
              >
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: selectedColor === c ? 'white' : 'transparent',
                    }}
                  />
                ))}
                <Button
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={creating}
                  className="h-6 px-2 text-[10px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-0 ml-auto"
                >
                  {creating ? '...' : <Check className="w-3 h-3" />}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Available Tags */}
          {filteredTags.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto scroll-fade-bottom">
              <p className="text-[10px] uppercase tracking-wider text-tertiary font-medium">Available Tags</p>
              {filteredTags.slice(0, 10).map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleToggleTag(tag.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-white/5 transition-colors text-left"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-foreground/80 truncate">{tag.name}</span>
                  <Plus className="w-3 h-3 ml-auto text-tertiary" />
                </button>
              ))}
            </div>
          )}

          {currentTags.length === 0 && filteredTags.length === 0 && !showCreateOption && (
            <p className="text-xs text-tertiary text-center py-2">No tags yet. Type to create one.</p>
          )}
        </motion.div>
      </PopoverContent>
    </Popover>
  )
}
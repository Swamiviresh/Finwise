'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type Note } from '@/store/use-app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  StickyNote, Plus, Search, Pin, PinOff, Edit3, Trash2, X,
  BookOpen, Target, PieChart, Lightbulb, Sparkles, FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  { value: '#10b981', label: 'Emerald' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#a78bfa', label: 'Violet' },
  { value: '#fbbf24', label: 'Amber' },
  { value: '#fb7185', label: 'Rose' },
]

const CATEGORIES = [
  { value: 'general', label: 'General', icon: FileText },
  { value: 'goal', label: 'Goal', icon: Target },
  { value: 'budget', label: 'Budget', icon: PieChart },
  { value: 'insight', label: 'Insight', icon: Lightbulb },
  { value: 'idea', label: 'Idea', icon: Sparkles },
] as const

const CATEGORY_ICONS: Record<string, typeof FileText> = {
  general: FileText,
  goal: Target,
  budget: PieChart,
  insight: Lightbulb,
  idea: Sparkles,
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  goal: 'Goal',
  budget: 'Budget',
  insight: 'Insight',
  idea: 'Idea',
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
}

interface NoteFormData {
  title: string
  content: string
  category: string
  color: string
  isPinned: boolean
}

const defaultFormData: NoteFormData = {
  title: '',
  content: '',
  category: 'general',
  color: '#10b981',
  isPinned: false,
}

export default function NotesPage() {
  const { user, notes, setNotes } = useAppStore()
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [formData, setFormData] = useState<NoteFormData>(defaultFormData)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchNotes = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/notes?userId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setNotes(data)
      }
    } catch {
      toast.error('Failed to load notes')
    }
  }, [user?.id, setNotes])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const filteredNotes = notes.filter(n => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
  })

  const pinnedNotes = filteredNotes.filter(n => n.isPinned)
  const unpinnedNotes = filteredNotes.filter(n => !n.isPinned)

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required')
      return
    }
    if (!user?.id) return

    setLoading(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...formData }),
      })
      if (res.ok) {
        toast.success('Note created')
        setAddOpen(false)
        setFormData(defaultFormData)
        fetchNotes()
      } else {
        toast.error('Failed to create note')
      }
    } catch {
      toast.error('Failed to create note')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedNote?.id) return
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedNote.id, ...formData }),
      })
      if (res.ok) {
        toast.success('Note updated')
        setEditOpen(false)
        setViewOpen(false)
        setSelectedNote(null)
        setFormData(defaultFormData)
        fetchNotes()
      } else {
        toast.error('Failed to update note')
      }
    } catch {
      toast.error('Failed to update note')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notes?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Note deleted')
        setViewOpen(false)
        setEditOpen(false)
        setSelectedNote(null)
        fetchNotes()
      } else {
        toast.error('Failed to delete note')
      }
    } catch {
      toast.error('Failed to delete note')
    }
  }

  const handleTogglePin = async (note: Note) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: note.id, isPinned: !note.isPinned }),
      })
      if (res.ok) {
        toast.success(note.isPinned ? 'Note unpinned' : 'Note pinned')
        fetchNotes()
      }
    } catch {
      toast.error('Failed to update pin')
    }
  }

  const openNoteView = (note: Note) => {
    setSelectedNote(note)
    setViewOpen(true)
  }

  const openNoteEdit = (note: Note) => {
    setSelectedNote(note)
    setFormData({
      title: note.title,
      content: note.content,
      category: note.category,
      color: note.color,
      isPinned: note.isPinned,
    })
    setEditOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 shimmer-text">
            <StickyNote className="w-6 h-6 text-emerald-400" />
            Financial Notes
          </h2>
          <p className="text-sm text-secondary mt-1">Capture ideas, insights, and financial observations</p>
        </div>
        <Button
          onClick={() => { setFormData(defaultFormData); setAddOpen(true) }}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-emerald-500/20 hover-glow-emerald"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center glass-input rounded-xl px-4 py-2.5 gap-3">
        <Search className="w-4 h-4 text-tertiary shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes by title or content..."
          className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-tertiary"
        />
        {search && (
          <button onClick={() => setSearch('')} className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10">
            <X className="w-3.5 h-3.5 text-tertiary" />
          </button>
        )}
      </div>

      {/* Empty State */}
      {notes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl empty-state-card"
        >
          <BookOpen className="w-16 h-16 text-emerald-400 empty-state-card-icon" />
          <h3 className="empty-state-card-title">No notes yet</h3>
          <p className="empty-state-card-desc">
            Start capturing your financial thoughts, goals, and insights. Notes help you track your financial journey and make better decisions.
          </p>
          <Button
            onClick={() => { setFormData(defaultFormData); setAddOpen(true) }}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Note
          </Button>
        </motion.div>
      )}

      {/* Search Empty State */}
      {notes.length > 0 && filteredNotes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl empty-state-card"
        >
          <Search className="w-10 h-10 text-tertiary empty-state-card-icon" />
          <h3 className="empty-state-card-title">No matching notes</h3>
          <p className="empty-state-card-desc">Try a different search term</p>
        </motion.div>
      )}

      {/* Pinned Notes Section */}
      <AnimatePresence>
        {pinnedNotes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Pin className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider">Pinned</h3>
              <span className="text-xs text-tertiary">({pinnedNotes.length})</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {pinnedNotes.map((note, i) => {
                const CatIcon = CATEGORY_ICONS[note.category] || FileText
                return (
                  <motion.button
                    key={note.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                    onClick={() => openNoteView(note)}
                    className="glass-subtle card-spotlight rounded-xl p-4 min-w-[240px] max-w-[280px] text-left shrink-0 group hover-scale-subtle transition-all duration-300 border-l-[3px]"
                    style={{ borderLeftColor: note.color }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-sm line-clamp-1">{note.title}</h4>
                      <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    </div>
                    <p className="text-xs text-secondary line-clamp-2 mb-3 leading-relaxed">{note.content}</p>
                    <div className="flex items-center gap-2">
                      <span className="tag-pill gap-1">
                        <CatIcon className="w-2.5 h-2.5" />
                        {CATEGORY_LABELS[note.category] || note.category}
                      </span>
                      <span className="text-[10px] text-tertiary ml-auto">{format(new Date(note.createdAt), 'MMM d')}</span>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <hr className="glass-divider" />

      {/* Notes Grid */}
      {unpinnedNotes.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="columns-1 lg:columns-2 gap-4 space-y-4"
        >
          {unpinnedNotes.map((note) => {
            const CatIcon = CATEGORY_ICONS[note.category] || FileText
            return (
              <motion.div
                key={note.id}
                variants={itemVariants}
                className="break-inside-avoid"
              >
                <button
                  onClick={() => openNoteView(note)}
                  className="w-full glass card-spotlight rounded-xl p-4 text-left group hover-scale-subtle transition-all duration-300 border-t-[3px]"
                  style={{ borderTopColor: note.color }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-sm line-clamp-1 flex-1">{note.title}</h4>
                    {note.isPinned && <Pin className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />}
                  </div>
                  <p className="text-xs text-secondary line-clamp-2 mb-3 leading-relaxed whitespace-pre-line">{note.content}</p>
                  <div className="flex items-center gap-2">
                    <span className="tag-pill gap-1">
                      <CatIcon className="w-2.5 h-2.5" />
                      {CATEGORY_LABELS[note.category] || note.category}
                    </span>
                    <span className="text-[10px] text-tertiary ml-auto">{format(new Date(note.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </button>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Add Note Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="glass border-white/10 sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              New Note
            </DialogTitle>
            <DialogDescription className="text-secondary">Capture a financial thought or insight</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-secondary">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                placeholder="Give your note a title..."
                className="input-premium glass-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-secondary">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(f => ({ ...f, content: e.target.value }))}
                placeholder="Write your note..."
                rows={4}
                className="input-premium glass-input resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-secondary">Category</label>
              <Select value={formData.category} onValueChange={(v) => setFormData(f => ({ ...f, category: v }))}>
                <SelectTrigger className="input-premium glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-white/10">
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value} className="gap-2">
                      <cat.icon className="w-4 h-4" />
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-secondary">Accent Color</label>
              <div className="flex gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setFormData(f => ({ ...f, color: c.value }))}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center',
                      formData.color === c.value
                        ? 'ring-2 ring-offset-2 ring-offset-background ring-white/50 scale-110'
                        : 'hover:scale-110 opacity-70 hover:opacity-100'
                    )}
                    style={{ background: c.value }}
                    title={c.label}
                  >
                    {formData.color === c.value && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-xs font-medium text-secondary">Pin to top</label>
                <p className="text-[10px] text-tertiary">Pinned notes always stay visible</p>
              </div>
              <Switch
                checked={formData.isPinned}
                onCheckedChange={(v) => setFormData(f => ({ ...f, isPinned: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={loading || !formData.title.trim() || !formData.content.trim()}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
            >
              {loading ? 'Creating...' : 'Create Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Note Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="glass border-white/10 sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedNote && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-6 rounded-full" style={{ background: selectedNote.color }} />
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 border-white/10 text-foreground/50 badge-glass gap-1">
                        {(() => { const Icon = CATEGORY_ICONS[selectedNote.category] || FileText; return <Icon className="w-3 h-3" /> })()}
                        {CATEGORY_LABELS[selectedNote.category] || selectedNote.category}
                      </Badge>
                      {selectedNote.isPinned && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 border-amber-500/30 text-amber-400 badge-glass gap-1">
                          <Pin className="w-2.5 h-2.5" />
                          Pinned
                        </Badge>
                      )}
                    </div>
                    <DialogTitle className="text-xl">{selectedNote.title}</DialogTitle>
                    <DialogDescription className="text-tertiary mt-1">
                      {format(new Date(selectedNote.createdAt), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                      {' · '}
                      Updated {format(new Date(selectedNote.updatedAt), 'MMM d, yyyy')}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="glass-subtle rounded-xl p-4 mt-2">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{selectedNote.content}</p>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTogglePin(selectedNote)}
                  className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                >
                  {selectedNote.isPinned ? <PinOff className="w-4 h-4 mr-1.5" /> : <Pin className="w-4 h-4 mr-1.5" />}
                  {selectedNote.isPinned ? 'Unpin' : 'Pin'}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openNoteEdit(selectedNote)}
                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                  >
                    <Edit3 className="w-4 h-4 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(selectedNote.id)}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="glass border-white/10 sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-emerald-400" />
              Edit Note
            </DialogTitle>
            <DialogDescription className="text-secondary">Update your financial note</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-secondary">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                placeholder="Note title..."
                className="input-premium glass-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-secondary">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(f => ({ ...f, content: e.target.value }))}
                placeholder="Note content..."
                rows={4}
                className="input-premium glass-input resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-secondary">Category</label>
              <Select value={formData.category} onValueChange={(v) => setFormData(f => ({ ...f, category: v }))}>
                <SelectTrigger className="input-premium glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-white/10">
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value} className="gap-2">
                      <cat.icon className="w-4 h-4" />
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-secondary">Accent Color</label>
              <div className="flex gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setFormData(f => ({ ...f, color: c.value }))}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center',
                      formData.color === c.value
                        ? 'ring-2 ring-offset-2 ring-offset-background ring-white/50 scale-110'
                        : 'hover:scale-110 opacity-70 hover:opacity-100'
                    )}
                    style={{ background: c.value }}
                    title={c.label}
                  >
                    {formData.color === c.value && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-xs font-medium text-secondary">Pin to top</label>
                <p className="text-[10px] text-tertiary">Pinned notes always stay visible</p>
              </div>
              <Switch
                checked={formData.isPinned}
                onCheckedChange={(v) => setFormData(f => ({ ...f, isPinned: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              onClick={handleUpdate}
              disabled={loading || !formData.title.trim() || !formData.content.trim()}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
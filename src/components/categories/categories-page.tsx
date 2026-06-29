'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore, type Category } from '@/store/use-app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Tag, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const ICON_OPTIONS = [
  '🍽️', '🚗', '🛍️', '☕', '🏠', '💰', '📚', '🎮', '💊', '✈️',
  '👑', '🎯', '🎸', '🐾', '🎬', '📱', '💡', '🔧', '🎨', '🏖️',
]

const COLOR_OPTIONS = [
  { name: 'emerald', value: '#10b981', bg: 'bg-emerald-500', ring: 'ring-emerald-500/50' },
  { name: 'cyan', value: '#06b6d4', bg: 'bg-cyan-500', ring: 'ring-cyan-500/50' },
  { name: 'violet', value: '#8b5cf6', bg: 'bg-violet-500', ring: 'ring-violet-500/50' },
  { name: 'amber', value: '#f59e0b', bg: 'bg-amber-500', ring: 'ring-amber-500/50' },
  { name: 'rose', value: '#f43f5e', bg: 'bg-rose-500', ring: 'ring-rose-500/50' },
]

interface CategoryFormData {
  name: string
  icon: string
  color: string
  type: 'expense' | 'income'
}

const defaultForm: CategoryFormData = {
  name: '',
  icon: '📋',
  color: '#10b981',
  type: 'expense',
}

export default function CategoriesPage() {
  const { user, categories, setCategories } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('expense')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryFormData>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchCategories = useCallback(async (type: string) => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/categories?userId=${user.id}&type=${type}`)
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [user?.id, setCategories])

  useEffect(() => {
    setLoading(true)
    fetchCategories(activeTab)
  }, [activeTab, fetchCategories])

  const openCreateDialog = (type: 'expense' | 'income') => {
    setEditingCategory(null)
    setForm({ ...defaultForm, type })
    setDialogOpen(true)
  }

  const openEditDialog = (cat: Category) => {
    setEditingCategory(cat)
    setForm({
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      type: cat.type,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Category name is required')
      return
    }
    if (!user?.id) return

    setSaving(true)
    try {
      if (editingCategory) {
        // Update
        const res = await fetch('/api/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCategory.id, ...form }),
        })
        if (res.ok) {
          toast.success('Category updated')
          setDialogOpen(false)
          fetchCategories(activeTab)
        } else {
          const data = await res.json()
          toast.error(data.error || 'Failed to update')
        }
      } else {
        // Create
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, ...form }),
        })
        if (res.ok) {
          toast.success('Category created')
          setDialogOpen(false)
          fetchCategories(activeTab)
        } else {
          const data = await res.json()
          toast.error(data.error || 'Failed to create')
        }
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Category deleted')
        setDeleteConfirm(null)
        fetchCategories(activeTab)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete')
      }
    } catch {
      toast.error('Something went wrong')
    }
  }

  const filteredCategories = categories.filter((c) => c.type === activeTab)
  const customCategories = filteredCategories.filter((c) => !c.isDefault)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Categories</h2>
          <p className="text-sm text-secondary mt-1">
            Manage your expense and income categories
          </p>
        </div>
        <Button
          onClick={() => openCreateDialog(activeTab as 'expense' | 'income')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-subtle">
          <TabsTrigger value="expense" className="data-[state=active]:text-emerald-400">
            <span className="mr-1.5">💸</span> Expense Categories
          </TabsTrigger>
          <TabsTrigger value="income" className="data-[state=active]:text-emerald-400">
            <span className="mr-1.5">💵</span> Income Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl glass card-depth-1 animate-pulse"
                />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-2xl glass-subtle flex items-center justify-center mb-4">
                <Tag className="w-8 h-8 text-foreground/20" />
              </div>
              <p className="text-lg font-medium text-secondary">No categories found</p>
              <p className="text-sm text-tertiary mt-1">Create your first custom category</p>
              <Button
                variant="outline"
                onClick={() => openCreateDialog(activeTab as 'expense' | 'income')}
                className="mt-4 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Category
              </Button>
            </motion.div>
          ) : (
            <>
              {/* Empty state for custom categories when they exist but all are default */}
              {customCategories.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-subtle rounded-xl p-4 mb-6 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">No custom categories yet</p>
                    <p className="text-xs text-tertiary">
                      You&apos;re using the default categories. Create custom ones to better track your finances.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openCreateDialog(activeTab as 'expense' | 'income')}
                    className="shrink-0 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add
                  </Button>
                </motion.div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredCategories.map((category, index) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      index={index}
                      onEdit={category.isDefault ? undefined : () => openEditDialog(category)}
                      onDelete={category.isDefault ? undefined : () => setDeleteConfirm(category.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-strong border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'New Category'}
            </DialogTitle>
            <DialogDescription className="text-secondary">
              {editingCategory
                ? 'Update your category details'
                : 'Create a custom category to track your finances'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g., Pet Care"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-white/5 border-white/10"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>

            {/* Icon Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Icon</label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, icon }))}
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all duration-150',
                      form.icon === icon
                        ? 'bg-emerald-500/20 ring-2 ring-emerald-500/50 scale-110'
                        : 'bg-white/5 hover:bg-white/10'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-3">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: color.value }))}
                    className={cn(
                      'w-10 h-10 rounded-full transition-all duration-150 flex items-center justify-center',
                      color.bg,
                      form.color === color.value
                        ? `ring-4 ${color.ring} scale-110`
                        : 'opacity-60 hover:opacity-100'
                    )}
                  >
                    {form.color === color.value && (
                      <Check className="w-5 h-5 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <div className="flex gap-2">
                {(['expense', 'income'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={cn(
                      'flex-1 h-9 rounded-lg text-sm font-medium transition-all duration-150',
                      form.type === t
                        ? t === 'expense'
                          ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                        : 'bg-white/5 text-secondary hover:bg-white/10'
                    )}
                  >
                    {t === 'expense' ? '💸 Expense' : '💵 Income'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              className="text-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
            >
              {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="glass-strong border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription className="text-secondary">
              Are you sure you want to delete this category? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirm(null)}
              className="text-secondary"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CategoryCard({
  category,
  index,
  onEdit,
  onDelete,
}: {
  category: Category
  index: number
  onEdit?: () => void
  onDelete?: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{
        duration: 0.25,
        delay: index * 0.04,
        layout: { duration: 0.2 },
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onEdit}
      className={cn(
        'relative group glass card-depth-1 rounded-xl p-4 flex flex-col items-center gap-3 transition-all duration-200',
        onEdit && 'cursor-pointer hover:card-depth-2 hover:border-white/15',
        !onEdit && 'opacity-70'
      )}
    >
      {/* Hover Actions */}
      <AnimatePresence>
        {hovered && (onEdit || onDelete) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-2 right-2 flex gap-1 z-10"
          >
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="w-7 h-7 rounded-lg bg-rose-500/20 backdrop-blur-sm flex items-center justify-center hover:bg-rose-500/30 transition-colors text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform duration-200 group-hover:scale-110"
        style={{ background: `${category.color}15` }}
      >
        {category.icon}
      </div>

      {/* Name */}
      <div className="text-center">
        <p className="text-sm font-medium truncate max-w-full">{category.name}</p>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: category.color }}
          />
          <span className="text-[11px] text-tertiary capitalize">
            {category.type}
          </span>
        </div>
      </div>

      {/* Default Badge */}
      {category.isDefault && (
        <Badge
          variant="outline"
          className="text-[9px] px-1.5 py-0 h-4 border-white/10 text-foreground/40 font-normal"
        >
          Default
        </Badge>
      )}
    </motion.div>
  )
}

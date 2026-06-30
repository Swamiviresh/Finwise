'use client'

import { useState, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Shield,
  Loader2, ArrowRight, ArrowLeft, X, FileText, Table, Trash2, Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

interface ImportResult {
  success: boolean
  transactions: number
  expenses: number
  incomes: number
  message: string
  error?: string
}

export default function StatementImport({
  onNext,
  onBack,
}: {
  onNext: () => void
  onBack: () => void
}) {
  const { user } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  const handleFile = useCallback((f: File) => {
    const validExtensions = ['.csv', '.xls', '.xlsx', '.tsv']
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!validExtensions.includes(ext)) {
      setError('Please upload a CSV or Excel file (.csv, .xls, .xlsx)')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB')
      return
    }
    setFile(f)
    setError('')
    setResult(null)
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const handleUpload = async () => {
    if (!file || !user?.id) return
    setUploading(true)
    setError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', user.id)

    try {
      const res = await fetch('/api/statements/upload', {
        method: 'POST',
        body: formData,
      })
      const data: ImportResult = await res.json()

      if (!res.ok) {
        setError(data.error || 'Upload failed')
        return
      }

      setResult(data)
      toast.success(data.message)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setResult(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="py-4"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Import Your Transactions</h2>
        <p className="text-sm text-foreground/60">
          Upload a bank statement or spreadsheet to get started quickly
        </p>
      </div>

      <div className="space-y-5 max-w-lg mx-auto">
        {/* Privacy Notice */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-3.5 border border-emerald-500/10"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-400 mb-1">Your Privacy is Protected</p>
              <p className="text-[11px] text-foreground/50 leading-relaxed">
                Account numbers, personal names, phone numbers, and other sensitive information are
                automatically detected and removed before any processing. AI only sees transaction
                amounts, categories, and dates — never your raw banking data.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Upload Area */}
        {!result ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !file && fileInputRef.current?.click()}
              className={`relative glass rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
                dragActive
                  ? 'border-emerald-400 bg-emerald-500/5 scale-[1.02]'
                  : file
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx,.tsv"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />

              <div className="p-8 text-center">
                {!file ? (
                  <>
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 flex items-center justify-center mx-auto mb-4 border border-white/5"
                    >
                      <Upload className="w-7 h-7 text-emerald-400" />
                    </motion.div>
                    <p className="text-sm font-medium mb-1">
                      Drag & drop your file here
                    </p>
                    <p className="text-xs text-foreground/40 mb-4">
                      or click to browse
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="inline-flex items-center gap-1.5 text-[10px] text-foreground/40 bg-white/5 px-2.5 py-1 rounded-full">
                        <FileText className="w-3 h-3" /> CSV
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[10px] text-foreground/40 bg-white/5 px-2.5 py-1 rounded-full">
                        <Table className="w-3 h-3" /> Excel
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-foreground/40">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleRemoveFile() }}
                      className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center hover:bg-rose-500/20 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4 text-rose-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Format hint */}
            <div className="mt-3 px-1">
              <p className="text-[10px] text-foreground/30">
                <Sparkles className="w-3 h-3 inline mr-1 text-amber-400/60" />
                Expected columns: <span className="text-foreground/50 font-medium">Date, Description, Amount</span>
                {' '}(and optionally Credit/Debit columns). Transactions are auto-categorized.
              </p>
            </div>
          </motion.div>
        ) : (
          /* Success Result */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl border border-emerald-500/20 p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </motion.div>
            <h3 className="text-lg font-bold mb-2">Import Successful!</h3>
            <p className="text-sm text-foreground/60 mb-4">{result.message}</p>
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
              <div className="glass-subtle rounded-xl p-3">
                <p className="text-lg font-bold text-rose-400">{result.expenses}</p>
                <p className="text-[10px] text-foreground/50">Expenses</p>
              </div>
              <div className="glass-subtle rounded-xl p-3">
                <p className="text-lg font-bold text-emerald-400">{result.incomes}</p>
                <p className="text-[10px] text-foreground/50">Incomes</p>
              </div>
              <div className="glass-subtle rounded-xl p-3">
                <p className="text-lg font-bold">{result.transactions}</p>
                <p className="text-[10px] text-foreground/50">Total</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-rose-400 font-medium">Upload Error</p>
              <p className="text-xs text-rose-400/70 mt-0.5">{error}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between mt-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-foreground/60 hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex gap-2">
          {!result ? (
            <>
              <Button
                variant="ghost"
                onClick={onNext}
                className="text-foreground/50 hover:text-foreground"
              >
                Skip for now
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white border-0 px-6"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Import</>
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={onNext}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white border-0 px-8"
            >
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
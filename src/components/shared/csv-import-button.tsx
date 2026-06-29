'use client'

import { useState, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface CsvImportButtonProps {
  /** If provided, overrides the 'type' column for all rows (for page-specific import) */
  defaultType?: 'expense' | 'income'
}

interface PreviewRow {
  type: string
  title: string
  amount: string
  categoryOrSource: string
  date: string
}

interface ImportResult {
  success: boolean
  created: number
  skipped: number
  total: number
  errors: { row: number; errors: string[] }[]
}

function detectDelimiter(firstLine: string): string {
  const semicolons = (firstLine.match(/;/g) || []).length
  const commas = (firstLine.match(/,/g) || []).length
  return semicolons > commas ? ';' : ','
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"' && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === delimiter) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }
  result.push(current.trim())
  return result
}

export default function CsvImportButton({ defaultType }: CsvImportButtonProps) {
  const { user, setExpenses, setIncomes } = useAppStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = useCallback(() => {
    setFile(null)
    setPreview([])
    setHeaders([])
    setResult(null)
    setError(null)
  }, [])

  const handleOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      // Reset after dialog close animation
      setTimeout(resetState, 200)
    }
  }, [resetState])

  const processFile = useCallback((selectedFile: File) => {
    setError(null)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')

      if (lines.length < 2) {
        setError('CSV file must have a header row and at least one data row')
        setFile(null)
        return
      }

      const delimiter = detectDelimiter(lines[0])
      const rawHeaders = parseCsvLine(lines[0], delimiter)
      setHeaders(rawHeaders)

      // Normalize headers for mapping
      const normalizedHeaders = rawHeaders.map(h =>
        h.toLowerCase().replace(/[^a-z0-9]/g, '')
      )

      // Find column indices
      const typeIdx = normalizedHeaders.indexOf('type')
      const titleIdx = normalizedHeaders.indexOf('title')
      const amountIdx = normalizedHeaders.indexOf('amount')
      const categoryIdx = normalizedHeaders.indexOf('category')
      const sourceIdx = normalizedHeaders.indexOf('source')
      const dateIdx = normalizedHeaders.indexOf('date')

      // Check required fields
      if (titleIdx === -1 || amountIdx === -1 || dateIdx === -1) {
        setError('Missing required columns: title, amount, date')
        setFile(null)
        return
      }

      // Build preview (first 5 data rows)
      const previewRows: PreviewRow[] = []
      const maxPreview = Math.min(5, lines.length - 1)

      for (let i = 1; i <= maxPreview; i++) {
        const values = parseCsvLine(lines[i], delimiter)
        const type = defaultType
          ? defaultType
          : typeIdx !== -1
            ? (values[typeIdx] || '').toLowerCase().trim()
            : categoryIdx !== -1
              ? 'expense'
              : 'income'

        previewRows.push({
          type,
          title: values[titleIdx] || '',
          amount: values[amountIdx] || '',
          categoryOrSource: type === 'expense'
            ? (categoryIdx !== -1 ? values[categoryIdx] || '' : '')
            : (sourceIdx !== -1 ? values[sourceIdx] || '' : ''),
          date: values[dateIdx] || '',
        })
      }

      setPreview(previewRows)
      setFile(selectedFile)
    }

    reader.onerror = () => {
      setError('Failed to read file')
      setFile(null)
    }

    reader.readAsText(selectedFile)
  }, [defaultType])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a .csv file')
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB')
      return
    }

    processFile(selectedFile)
  }, [processFile])

  const handleImport = useCallback(async () => {
    if (!file || !user?.id) return

    setImporting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', user.id)

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Import failed')
        toast.error('Import failed', { description: data.error })
        return
      }

      setResult(data)

      if (data.created > 0) {
        toast.success(`Imported ${data.created} transaction${data.created !== 1 ? 's' : ''}`)
      }
      if (data.skipped > 0) {
        toast.warning(`${data.skipped} row${data.skipped !== 1 ? 's' : ''} skipped`)
      }

      // Refresh store data
      try {
        const [expensesRes, incomesRes] = await Promise.all([
          fetch(`/api/expenses?userId=${user.id}`),
          fetch(`/api/incomes?userId=${user.id}`),
        ])
        const [expensesData, incomesData] = await Promise.all([
          expensesRes.json(),
          incomesRes.json(),
        ])
        setExpenses(expensesData)
        setIncomes(incomesData)
      } catch {
        // Non-critical - the import itself succeeded
      }
    } catch {
      setError('Network error - please try again')
      toast.error('Import failed', { description: 'Network error' })
    } finally {
      setImporting(false)
    }
  }, [file, user?.id, setExpenses, setIncomes])

  const handleDropZoneClick = () => {
    fileInputRef.current?.click()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.csv')) {
        setError('Please select a .csv file')
        return
      }
      processFile(droppedFile)
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="glass border-white/10 hover:bg-white/10 text-foreground/80 hover:text-foreground"
        >
          <Upload className="w-4 h-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>

      <DialogContent className="glass border-0 sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            Import CSV
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload a CSV file with columns: type, title, amount, category/source, date, description, isRecurring
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Drop zone */}
          <div
            onClick={handleDropZoneClick}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
            {file ? (
              <div>
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  type="button"
                  className="text-xs text-emerald-400 hover:text-emerald-300 mt-2 underline underline-offset-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    resetState()
                  }}
                >
                  Change file
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground/80">Click to browse or drag & drop</p>
                <p className="text-xs text-muted-foreground mt-1">.csv files up to 5MB</p>
              </>
            )}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                <p className="text-sm text-rose-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview table */}
          {preview.length > 0 && !result && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Preview (first {preview.length} rows)
              </p>
              <div className="rounded-lg border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Type</th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Title</th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Amount</th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">
                          {defaultType === 'income' ? 'Source' : defaultType === 'expense' ? 'Category' : 'Cat/Source'}
                        </th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-t border-white/5">
                          <td className="px-3 py-2">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              row.type === 'expense'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {row.type}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-foreground truncate max-w-[120px]">{row.title}</td>
                          <td className="px-3 py-2 text-foreground">${row.amount}</td>
                          <td className="px-3 py-2 text-muted-foreground truncate max-w-[100px]">{row.categoryOrSource}</td>
                          <td className="px-3 py-2 text-muted-foreground">{row.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detected headers info */}
              <p className="text-[11px] text-muted-foreground">
                Detected columns: {headers.join(', ')}
              </p>
            </div>
          )}

          {/* Import result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                    <p className="text-lg font-bold text-emerald-400">{result.created}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Imported</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                    <p className="text-lg font-bold text-amber-400">{result.skipped}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Skipped</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
                    <FileSpreadsheet className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold text-foreground">{result.total}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                  </div>
                </div>

                {/* Error details */}
                {result.errors.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Errors ({result.errors.length})
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1 scroll-fade-bottom">
                      {result.errors.map((err, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded bg-rose-500/5 text-xs">
                          <XCircle className="w-3 h-3 text-rose-400 mt-0.5 shrink-0" />
                          <span className="text-rose-300">
                            {err.row > 0 ? `Row ${err.row}: ` : ''}
                            {err.errors.join('; ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {result ? (
              <Button
                className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0"
                onClick={() => handleOpenChange(false)}
              >
                Done
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="flex-1 text-muted-foreground hover:text-foreground"
                  onClick={() => handleOpenChange(false)}
                  disabled={importing}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0 disabled:opacity-50"
                  onClick={handleImport}
                  disabled={!file || importing}
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import{preview.length > 0 ? ` ${preview.length}+ rows` : ''}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
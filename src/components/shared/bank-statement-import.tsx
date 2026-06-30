'use client'

import { useState, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { FileText, Upload, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '@/lib/format-currency'

interface PreviewItem { type: string; title: string; amount: number; category: string; date: string; rawDesc: string }
interface PreviewResult { success: boolean; action: string; headers: string[]; total: number; expenses: number; income: number; preview: PreviewItem[]; allTransactions?: PreviewItem[]; error?: string }

export default function BankStatementImport() {
  const { user, setExpenses, setIncomes } = useAppStore()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => { setPreview(null); setError(null) }, [])

  const handleFile = async (selectedFile: File) => {
    setError(null); setPreview(null); setLoading(true)
    const fd = new FormData(); fd.append('file', selectedFile); fd.append('userId', user?.id || '')
    try {
      const res = await fetch('/api/import-statement', { method: 'POST', body: fd })
      const data: PreviewResult = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to parse'); return }
      setPreview(data)
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleImport = async () => {
    if (!preview?.allTransactions || !user?.id) return
    setImporting(true)
    const fd = new FormData(); fd.append('userId', user.id); fd.append('action', 'confirm'); fd.append('transactions', JSON.stringify(preview.allTransactions))
    try {
      const res = await fetch('/api/import-statement', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.created > 0) toast.success(`Imported ${data.created} transactions from bank statement`)
      try {
        const [eRes, iRes] = await Promise.all([fetch(`/api/expenses?userId=${user.id}`), fetch(`/api/incomes?userId=${user.id}`)])
        const [eData, iData] = await Promise.all([eRes.json(), iRes.json()])
        setExpenses(eData); setIncomes(iData)
      } catch { /* non-critical */ }
      setOpen(false); setTimeout(reset, 200)
    } catch { toast.error('Import failed') } finally { setImporting(false) }
  }

  const changeFile = () => { reset(); fileRef.current?.click() }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setTimeout(reset, 200) }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="glass border-white/10 hover:bg-white/10 text-foreground/80 hover:text-foreground">
          <FileText className="w-4 h-4 mr-2" />
          Bank Statement
        </Button>
      </DialogTrigger>
      <DialogContent className="glass border-0 sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Import Bank Statement
          </DialogTitle>
          <DialogDescription>Upload your bank statement CSV. We auto-detect columns and categorize transactions.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
          {!preview && !error && (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
            >
              {loading ? <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-emerald-400" /> : <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />}
              <p className="text-sm font-medium">{loading ? 'Analyzing statement...' : 'Click or drag your bank statement CSV'}</p>
              <p className="text-xs text-muted-foreground mt-1">Supports SBI, HDFC, ICICI, Axis & most bank formats</p>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-rose-400">{error}</p>
                <button onClick={() => fileRef.current?.click()} className="text-xs text-emerald-400 underline mt-1">Try another file</button>
              </div>
            </div>
          )}
          <AnimatePresence>
            {preview && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-lg font-bold text-emerald-400">{preview.total}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                  </div>
                  <div className="text-center p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <p className="text-lg font-bold text-rose-400">{preview.expenses}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Expenses</p>
                  </div>
                  <div className="text-center p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <p className="text-lg font-bold text-cyan-400">{preview.income}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Income</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Detected columns: {preview.headers.join(', ')}</p>
                <div className="rounded-lg border border-white/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-white/5">
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Type</th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Description</th>
                        <th className="text-right px-3 py-2 text-muted-foreground font-medium">Amount</th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Category</th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Date</th>
                      </tr></thead>
                      <tbody>
                        {preview.preview.map((row, i) => (
                          <tr key={i} className="border-t border-white/5">
                            <td className="px-3 py-2"><span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${row.type === 'expense' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{row.type}</span></td>
                            <td className="px-3 py-2 text-foreground truncate max-w-[140px]" title={row.rawDesc}>{row.title}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(row.amount)}</td>
                            <td className="px-3 py-2 text-muted-foreground">{row.category}</td>
                            <td className="px-3 py-2 text-muted-foreground">{new Date(row.date).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {preview.total > 10 && <p className="text-xs text-center text-muted-foreground py-2 border-t border-white/5">Showing 10 of {preview.total} transactions</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={changeFile} disabled={importing}>Change File</Button>
                  <Button className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0" onClick={handleImport} disabled={importing}>
                    {importing ? 'Importing...' : `Import ${preview.total} Transactions`}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}

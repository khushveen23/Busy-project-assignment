'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload, CheckCircle2, XCircle, FileText, Download } from 'lucide-react'
import Link from 'next/link'

interface ImportResultRow {
  row: number
  status: 'ok' | 'error'
  code?: string
  error?: string
}

interface ImportSummary {
  total: number
  imported: number
  failed: number
  results: ImportResultRow[]
}

export default function ImportItemsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [error, setError] = useState('')

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError('')
    setSummary(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/items/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Import failed.')
        setLoading(false)
        return
      }

      setSummary(data)
    } catch {
      setError('An unexpected error occurred during upload.')
    } finally {
      setLoading(false)
    }
  }

  function downloadSampleCsv() {
    const csvContent = 'title,category,code\nCanon EOS R6,Photography,CAM-004\nEpson Pro Projector,AV Equipment,PROJ-003\nDewalt Jigsaw,Tools,TOOL-003'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-items.csv'
    a.click()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/items" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Catalogue
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Bulk Import Items</h1>
        <p className="text-muted-foreground mt-1">
          Upload a CSV file containing <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">title</code>,{' '}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">category</code>, and{' '}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">code</code> headers.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>CSV Upload</CardTitle>
            <CardDescription>Select a CSV file to import catalogue records.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={downloadSampleCsv}>
            <Download className="w-4 h-4 mr-2" /> Sample CSV
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleImport} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <input
                type="file"
                accept=".csv"
                id="csvFile"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="csvFile" className="cursor-pointer">
                <span className="font-semibold text-primary hover:underline">Click to browse</span>
                <span className="text-muted-foreground"> or drag and drop CSV file</span>
              </label>
              {file && (
                <p className="text-sm font-mono text-emerald-400 mt-2">
                  Selected file: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link href="/items">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" loading={loading} disabled={!file}>
                <Upload className="w-4 h-4 mr-2" /> Start Import
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Goal 7 Requirement: Per-row report naming exactly which rows failed and why while every valid row is imported */}
      {summary && (
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-xl font-bold">Import Results Summary</h2>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm font-medium text-emerald-400">
                ✅ {summary.imported} Succeeded
              </span>
              <span className="text-sm font-medium text-red-400">
                ❌ {summary.failed} Failed
              </span>
              <span className="text-sm text-muted-foreground">
                Total: {summary.total} rows processed
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3 font-medium">Row #</th>
                  <th className="p-3 font-medium">Item Code</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Details / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summary.results.map((res, i) => (
                  <tr key={i} className={res.status === 'error' ? 'bg-red-500/5' : 'bg-emerald-500/5'}>
                    <td className="p-3 font-mono font-medium">{res.row}</td>
                    <td className="p-3 font-mono">{res.code || '—'}</td>
                    <td className="p-3">
                      {res.status === 'ok' ? (
                        <span className="inline-flex items-center text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Imported
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-400 text-xs font-semibold">
                          <XCircle className="w-4 h-4 mr-1" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {res.error ? <span className="text-red-300 font-mono">{res.error}</span> : 'Successfully imported into catalogue'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex justify-end">
            <Link href="/items">
              <Button>Go to Catalogue</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}

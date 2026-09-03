'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckSquare, ArrowLeft, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { formatDate, isOverdue } from '@/lib/utils'

interface IssuedLoan {
  id: string
  status: string
  issuedAt?: string
  dueDate?: string
  item: { title: string; code: string }
  borrower: { name: string; email: string }
}

interface BulkResult {
  total: number
  succeeded: number
  failed: number
  results: { loanId: string; status: 'ok' | 'error'; error?: string }[]
}

export default function BulkReturnPage() {
  const [issuedLoans, setIssuedLoans] = useState<IssuedLoan[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<BulkResult | null>(null)
  const [error, setError] = useState('')

  function loadIssuedLoans() {
    setLoading(true)
    fetch('/api/loans?status=ISSUED&limit=50')
      .then((res) => res.json())
      .then((data) => {
        setIssuedLoans(data.loans || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadIssuedLoans()
  }, [])

  function toggleSelectAll() {
    if (selectedIds.length === issuedLoans.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(issuedLoans.map((l) => l.id))
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  async function handleBulkReturn() {
    if (selectedIds.length === 0) return
    setSubmitting(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/loans/bulk-return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanIds: selectedIds }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Bulk return failed.')
        setSubmitting(false)
        return
      }

      setResult(data)
      loadIssuedLoans()
      setSelectedIds([])
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/loans" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Loans
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Bulk Process Returns</h1>
        <p className="text-muted-foreground mt-1">Select multiple issued loans to process their return in a single action.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Currently Issued Loans</CardTitle>
            <CardDescription>Select items that have been physically returned to the library shelf.</CardDescription>
          </div>
          {issuedLoans.length > 0 && (
            <Button variant="outline" size="sm" onClick={toggleSelectAll}>
              {selectedIds.length === issuedLoans.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading active issued loans...</div>
          ) : issuedLoans.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No active issued loans available for return.</div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="p-3 w-10">Select</th>
                    <th className="p-3 font-medium">Catalogue Item</th>
                    <th className="p-3 font-medium">Borrower</th>
                    <th className="p-3 font-medium">Issued / Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {issuedLoans.map((loan) => {
                    const isSelected = selectedIds.includes(loan.id)
                    const overdue = isOverdue(loan.status, loan.dueDate)

                    return (
                      <tr
                        key={loan.id}
                        onClick={() => toggleSelect(loan.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10' : 'hover:bg-muted/30'
                        }`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by row click
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-bold">{loan.item.title}</div>
                          <div className="text-xs text-muted-foreground font-mono">{loan.item.code}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{loan.borrower.name}</div>
                          <div className="text-xs text-muted-foreground">{loan.borrower.email}</div>
                        </td>
                        <td className="p-3 text-xs">
                          <div>Issued: {formatDate(loan.issuedAt)}</div>
                          <div className={overdue ? 'text-red-400 font-bold' : 'text-muted-foreground'}>
                            Due: {formatDate(loan.dueDate)} {overdue && '(OVERDUE)'}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} loan(s) selected
            </span>
            <Button
              onClick={handleBulkReturn}
              loading={submitting}
              disabled={selectedIds.length === 0}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <CheckSquare className="w-4 h-4 mr-2" /> Process Return ({selectedIds.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Goal 7 Requirement: Per-loan result report detailing what succeeded and what failed */}
      {result && (
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-xl font-bold">Bulk Return Results</h2>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm font-medium text-emerald-400">
                ✅ {result.succeeded} Successfully Returned
              </span>
              <span className="text-sm font-medium text-red-400">
                ❌ {result.failed} Rejected / Failed
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3 font-medium">Loan ID</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Result / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.results.map((res, i) => (
                  <tr key={i} className={res.status === 'error' ? 'bg-red-500/5' : 'bg-emerald-500/5'}>
                    <td className="p-3 font-mono text-xs">{res.loanId}</td>
                    <td className="p-3">
                      {res.status === 'ok' ? (
                        <span className="inline-flex items-center text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Returned
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-400 text-xs font-semibold">
                          <XCircle className="w-4 h-4 mr-1" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {res.error ? <span className="text-red-300 font-mono">{res.error}</span> : 'Returned to library shelf successfully'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex justify-end">
            <Link href="/loans">
              <Button>Return to Loans List</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle2, ArrowRight, RefreshCw, BellOff } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface OverdueAlert {
  id: string
  status: string
  issuedAt?: string
  dueDate?: string
  item: { id: string; title: string; code: string }
  borrower: { id: string; name: string; email: string }
}

export default function OverdueAlertsPage() {
  const [alerts, setAlerts] = useState<OverdueAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissingId, setDismissingId] = useState<string | null>(null)

  function loadAlerts() {
    setLoading(true)
    fetch('/api/alerts')
      .then((res) => res.json())
      .then((data) => {
        setAlerts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  async function handleDismiss(loanId: string) {
    setDismissingId(loanId)
    await fetch(`/api/alerts/${loanId}/dismiss`, { method: 'POST' })
    setDismissingId(null)
    loadAlerts()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight">Overdue Loan Alerts</h1>
            {alerts.length > 0 && (
              <span className="bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold px-2.5 py-1 rounded-full">
                {alerts.length} Active Alert(s)
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Issued loans past their due date requiring librarian attention. Dismissing hides the alert for this loan.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadAlerts}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh Alerts
        </Button>
      </div>

      {/* Goal 10 Alert Rules Notice */}
      <Card className="p-4 bg-red-500/5 border-red-500/20">
        <div className="flex items-start gap-3 text-xs text-red-300">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Overdue Alert Lifecycle Rules</p>
            <p className="mt-0.5">
              Dismissing an alert removes it from your alerts feed for the current loan. If the item is returned and later issued again on a new loan that becomes overdue, the alert will return automatically.
            </p>
          </div>
        </div>
      </Card>

      {/* Alerts Feed */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading active overdue alerts...</div>
      ) : alerts.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <BellOff className="w-12 h-12 mx-auto mb-3 opacity-40 text-emerald-400" />
          <p className="text-lg font-semibold text-foreground">No active overdue alerts</p>
          <p className="text-sm mt-1">All issued loans are currently within their due dates or dismissed.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((loan) => (
            <Card key={loan.id} className="p-5 border-red-500/30 bg-gradient-to-r from-card via-card to-red-500/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{loan.item.title}</span>
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      {loan.item.code}
                    </span>
                    <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                      OVERDUE
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Borrower: <span className="font-semibold text-foreground">{loan.borrower.name}</span> ({loan.borrower.email})
                  </p>

                  <div className="flex items-center gap-4 text-xs mt-2 pt-2 border-t border-border/50 text-muted-foreground">
                    <span>Issued: {formatDate(loan.issuedAt)}</span>
                    <span className="text-red-400 font-bold">Due Date: {formatDate(loan.dueDate)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/loans/${loan.id}`}>
                    <Button variant="outline" size="sm">
                      View Loan <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDismiss(loan.id)}
                    loading={dismissingId === loan.id}
                  >
                    Dismiss Alert
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

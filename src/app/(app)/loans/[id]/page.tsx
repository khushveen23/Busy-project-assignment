'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, AlertCircle, XCircle, FileText, Send, Calendar, ShieldCheck, User, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatDate, formatDateTime, getDisplayStatus, isOverdue } from '@/lib/utils'

interface LoanEvent {
  id: string
  eventType: 'REQUESTED' | 'ISSUED' | 'RETURNED' | 'LOST' | 'NOTE'
  note?: string
  createdAt: string
  actor: { id: string; name: string; role: string }
}

interface LoanDetail {
  id: string
  status: 'REQUESTED' | 'ISSUED' | 'RETURNED' | 'LOST'
  requestedAt: string
  issuedAt?: string
  dueDate?: string
  returnedAt?: string
  lostAt?: string
  item: {
    id: string
    title: string
    code: string
    category: string
    custodians: { id: string; name: string; email: string }[]
  }
  borrower: { id: string; name: string; email: string }
  issuedBy?: { id: string; name: string }
  processedBy?: { id: string; name: string }
  events: LoanEvent[]
}

export default function LoanDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { data: session } = useSession()
  const isLibrarian = session?.user?.role === 'LIBRARIAN'

  const [loan, setLoan] = useState<LoanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  // Form states for actions
  const [dueDate, setDueDate] = useState('')
  const [actionNote, setActionNote] = useState('')
  const [newNote, setNewNote] = useState('')

  function loadLoan() {
    if (!id) return
    setLoading(true)
    fetch(`/api/loans/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          setLoan(null)
          setLoading(false)
          return
        }
        const data = await res.json()
        if (data && data.id) {
          setLoan(data)
        } else {
          setLoan(null)
        }
        setLoading(false)
      })
      .catch(() => {
        setLoan(null)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadLoan()
  }, [id])

  // Default due date to +14 days from today
  useEffect(() => {
    const defaultDue = new Date()
    defaultDue.setDate(defaultDue.getDate() + 14)
    setDueDate(defaultDue.toISOString().slice(0, 10))
  }, [])

  async function handleTransition(action: 'issue' | 'return' | 'lost') {
    setActionLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/loans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          dueDate: action === 'issue' ? dueDate : undefined,
          note: actionNote,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update loan state.')
        setActionLoading(false)
        return
      }

      setActionNote('')
      setActionLoading(false)
      loadLoan()
    } catch {
      setError('An unexpected error occurred.')
      setActionLoading(false)
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!newNote.trim()) return
    setActionLoading(true)

    await fetch(`/api/loans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'note', note: newNote }),
    })

    setNewNote('')
    setActionLoading(false)
    loadLoan()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!loan || !loan.id) {
    return (
      <div className="space-y-4">
        <Link href="/loans" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Loans
        </Link>
        <Card className="p-8 text-center text-muted-foreground">
          <p className="text-lg font-semibold text-foreground">Loan not found</p>
          <p className="text-sm mt-1">This loan does not exist or you do not have permission to view it.</p>
        </Card>
      </div>
    )
  }

  const overdue = isOverdue(loan.status, loan.dueDate)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/loans" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Loans
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight">Loan #{loan.id.slice(0, 8)}</h1>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                overdue ? 'status-overdue' : `status-${loan.status.toLowerCase()}`
              }`}>
                {getDisplayStatus(loan.status, loan.dueDate)}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">
              Catalogue Item: <span className="font-semibold text-foreground">{loan.item?.title || 'Unknown'}</span> ({loan.item?.code || 'N/A'})
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Action Rejected</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Loan Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Borrower</span>
                <p className="font-semibold text-foreground mt-0.5">{loan.borrower.name}</p>
                <p className="text-xs text-muted-foreground">{loan.borrower.email}</p>
              </div>

              <div>
                <span className="text-muted-foreground">Date Requested</span>
                <p className="font-semibold text-foreground mt-0.5">{formatDateTime(loan.requestedAt)}</p>
              </div>

              <div>
                <span className="text-muted-foreground">Issued Date & Issuer</span>
                <p className="font-semibold text-foreground mt-0.5">{formatDate(loan.issuedAt)}</p>
                {loan.issuedBy && <p className="text-xs text-muted-foreground">Issued by {loan.issuedBy.name}</p>}
              </div>

              <div>
                <span className="text-muted-foreground">Due Date</span>
                <p className={`font-semibold mt-0.5 ${overdue ? 'text-red-400 font-bold' : 'text-foreground'}`}>
                  {formatDate(loan.dueDate)} {overdue && '(OVERDUE)'}
                </p>
              </div>

              {loan.returnedAt && (
                <div>
                  <span className="text-muted-foreground">Returned Date</span>
                  <p className="font-semibold text-emerald-400 mt-0.5">{formatDateTime(loan.returnedAt)}</p>
                </div>
              )}

              {loan.lostAt && (
                <div>
                  <span className="text-muted-foreground">Marked Lost Date</span>
                  <p className="font-semibold text-orange-400 mt-0.5">{formatDateTime(loan.lostAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goal 4 Lifecycle Actions (Librarians only) */}
          {isLibrarian && (
            <Card>
              <CardHeader>
                <CardTitle>Librarian Actions</CardTitle>
                <CardDescription>Execute permitted lifecycle transitions based on current status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 1. REQUESTED → ISSUED */}
                {loan.status === 'REQUESTED' && (
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-4">
                    <h3 className="font-bold text-blue-400 flex items-center gap-2">
                      <Calendar className="w-5 h-5" /> Issue Loan to Borrower
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Due Date</label>
                        <Input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Note (Optional)</label>
                        <Input
                          placeholder="e.g. Approved for photoshoot"
                          value={actionNote}
                          onChange={(e) => setActionNote(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button onClick={() => handleTransition('issue')} loading={actionLoading} className="w-full">
                      Issue Item
                    </Button>
                  </div>
                )}

                {/* 2. ISSUED → RETURNED or LOST */}
                {loan.status === 'ISSUED' && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Action Note (Optional)</label>
                      <Input
                        placeholder="e.g. Returned in good condition / Borrower reported lost"
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button
                        onClick={() => handleTransition('return')}
                        loading={actionLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Process Return
                      </Button>
                      <Button
                        onClick={() => handleTransition('lost')}
                        loading={actionLoading}
                        variant="destructive"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" /> Mark as Lost
                      </Button>
                    </div>
                  </div>
                )}

                {/* Terminated states */}
                {['RETURNED', 'LOST'].includes(loan.status) && (
                  <p className="text-sm text-muted-foreground italic">
                    This loan is {loan.status.toLowerCase()} and cannot undergo further state changes.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Add Note Component */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base">Add Note to Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddNote} className="flex gap-2">
                <Input
                  placeholder="Leave a note on this loan..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <Button type="submit" loading={actionLoading} disabled={!newNote.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Goal 9 Immutable History Timeline */}
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-primary" />
                Immutable Timeline
              </CardTitle>
              <CardDescription>Permanent audit log of every change and note (cannot be edited or deleted)</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div className="relative pl-6 border-l-2 border-border space-y-6">
                {loan.events.map((event) => {
                  let badgeColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  if (event.eventType === 'ISSUED') badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  if (event.eventType === 'RETURNED') badgeColor = 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                  if (event.eventType === 'LOST') badgeColor = 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  if (event.eventType === 'NOTE') badgeColor = 'bg-purple-500/20 text-purple-400 border-purple-500/30'

                  return (
                    <div key={event.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background" />

                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className={`text-[10px] font-bold ${badgeColor}`}>
                            {event.eventType}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">{formatDateTime(event.createdAt)}</span>
                        </div>

                        <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          {event.actor.name} ({event.actor.role.toLowerCase()})
                        </p>

                        {event.note && (
                          <div className="p-2 rounded-lg bg-muted/40 text-xs text-foreground mt-1 border border-border/50 italic">
                            &quot;{event.note}&quot;
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

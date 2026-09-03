'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Edit, ShieldCheck, UserPlus, UserMinus, Clock, Package, Archive, ArchiveRestore, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatDate, getDisplayStatus, isOverdue } from '@/lib/utils'

interface ItemDetail {
  id: string
  title: string
  category: string
  code: string
  archived: boolean
  custodians: { id: string; name: string; email: string }[]
  loans: {
    id: string
    status: 'REQUESTED' | 'ISSUED' | 'RETURNED' | 'LOST'
    requestedAt: string
    issuedAt?: string
    dueDate?: string
    returnedAt?: string
    borrower: { id: string; name: string; email: string }
    issuedBy?: { id: string; name: string }
  }[]
}

interface LibrarianUser {
  id: string
  name: string
  email: string
}

export default function ItemDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { data: session } = useSession()
  const isLibrarian = session?.user?.role === 'LIBRARIAN'

  const [item, setItem] = useState<ItemDetail | null>(null)
  const [librarians, setLibrarians] = useState<LibrarianUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLibrarian, setSelectedLibrarian] = useState('')
  const [assigning, setAssigning] = useState(false)

  function loadItem() {
    if (!id) return
    setLoading(true)
    fetch(`/api/items/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          setItem(null)
          setLoading(false)
          return
        }
        const data = await res.json()
        if (data && data.id) {
          setItem(data)
        } else {
          setItem(null)
        }
        setLoading(false)
      })
      .catch(() => {
        setItem(null)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadItem()
    if (isLibrarian) {
      fetch('/api/members?role=LIBRARIAN')
        .then((res) => res.json())
        .then((data) => setLibrarians(Array.isArray(data) ? data : []))
        .catch(() => {})
    }
  }, [id, isLibrarian])

  async function handleAssignCustodian() {
    if (!selectedLibrarian) return
    setAssigning(true)

    await fetch('/api/custodians', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: id, librarianId: selectedLibrarian }),
    })

    setSelectedLibrarian('')
    setAssigning(false)
    loadItem()
  }

  async function handleRemoveCustodian(librarianId: string) {
    if (!confirm('Remove this librarian as a custodian?')) return

    await fetch('/api/custodians', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: id, librarianId }),
    })
    loadItem()
  }

  async function handleToggleArchive() {
    if (!item) return
    if (!confirm(`Are you sure you want to ${item.archived ? 'restore' : 'archive'} this item?`)) return

    await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: !item.archived }),
    })
    loadItem()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!item || !item.id) {
    return (
      <div className="space-y-4">
        <Link href="/items" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Catalogue
        </Link>
        <Card className="p-8 text-center text-muted-foreground">
          <p className="text-lg font-semibold text-foreground">Catalogue item not found</p>
          <p className="text-sm mt-1">This item does not exist or has been removed.</p>
        </Card>
      </div>
    )
  }

  const activeLoan = item.loans.find((l) => ['REQUESTED', 'ISSUED'].includes(l.status))

  return (
    <div className="space-y-8">
      {/* Back button & Header */}
      <div>
        <Link href="/items" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Catalogue
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight">{item.title}</h1>
              <Badge variant="outline" className="font-mono text-sm">{item.code}</Badge>
              {item.archived && <Badge variant="secondary">Archived</Badge>}
            </div>
            <p className="text-muted-foreground mt-1">Category: {item.category}</p>
          </div>

          <div className="flex items-center gap-3">
            {!activeLoan && !item.archived && (
              <Link href={`/loans/new?itemId=${item.id}`}>
                <Button>Create / Request Loan</Button>
              </Link>
            )}

            {isLibrarian && (
              <>
                <Link href={`/items/${item.id}/edit`}>
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" /> Edit Item
                  </Button>
                </Link>

                <Button variant="ghost" onClick={handleToggleArchive}>
                  {item.archived ? (
                    <>
                      <ArchiveRestore className="w-4 h-4 mr-2 text-emerald-400" /> Restore
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4 mr-2 text-red-400" /> Archive
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Item Overview & Status Alert */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Item Status & Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Availability</p>
                <div className="mt-1">
                  {activeLoan ? (
                    <span className="text-lg font-bold text-amber-400">
                      Currently Loaned ({getDisplayStatus(activeLoan.status, activeLoan.dueDate)})
                    </span>
                  ) : (
                    <span className="text-lg font-bold text-emerald-400">Available for Borrowing</span>
                  )}
                </div>
              </div>
              <div>
                {activeLoan && (
                  <Link href={`/loans/${activeLoan.id}`}>
                    <Button variant="outline" size="sm">View Active Loan</Button>
                  </Link>
                )}
              </div>
            </div>

            {activeLoan && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Active Loan Lock</p>
                  <p className="text-xs text-amber-300/80 mt-0.5">
                    This item cannot be issued to a new borrower while an open loan ({activeLoan.status}) exists against it.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custodians Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Custodians
            </CardTitle>
            <CardDescription>Librarians responsible for condition</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {item.custodians.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border text-sm">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </div>
                  {isLibrarian && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveCustodian(c.id)} title="Remove Custodian">
                      <UserMinus className="w-4 h-4 text-red-400" />
                    </Button>
                  )}
                </div>
              ))}
              {item.custodians.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No custodians assigned yet.</p>
              )}
            </div>

            {isLibrarian && (
              <div className="pt-3 border-t border-border flex items-center gap-2">
                <select
                  value={selectedLibrarian}
                  onChange={(e) => setSelectedLibrarian(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select a librarian...</option>
                  {librarians
                    .filter((l) => !item.custodians.some((c) => c.id === l.id))
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                </select>
                <Button size="sm" onClick={handleAssignCustodian} disabled={!selectedLibrarian || assigning}>
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goal 3 Requirement: Opening an item shows every loan ever made against it */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Complete Loan History
          </CardTitle>
          <CardDescription>Every loan ever issued or requested for this item ({item.loans.length} total)</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-3 font-medium">Borrower</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Requested Date</th>
                <th className="pb-3 font-medium">Issued Date</th>
                <th className="pb-3 font-medium">Due Date</th>
                <th className="pb-3 font-medium">Returned / Lost Date</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {item.loans.map((loan) => {
                const overdue = isOverdue(loan.status, loan.dueDate)
                return (
                  <tr key={loan.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5">
                      <div className="font-semibold">{loan.borrower.name}</div>
                      <div className="text-xs text-muted-foreground">{loan.borrower.email}</div>
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        overdue ? 'status-overdue' : `status-${loan.status.toLowerCase()}`
                      }`}>
                        {getDisplayStatus(loan.status, loan.dueDate)}
                      </span>
                    </td>
                    <td className="py-3.5 text-muted-foreground">{formatDate(loan.requestedAt)}</td>
                    <td className="py-3.5 text-muted-foreground">{formatDate(loan.issuedAt)}</td>
                    <td className="py-3.5 font-medium">{formatDate(loan.dueDate)}</td>
                    <td className="py-3.5 text-muted-foreground">{formatDate(loan.returnedAt)}</td>
                    <td className="py-3.5 text-right">
                      <Link href={`/loans/${loan.id}`}>
                        <Button variant="ghost" size="sm">View Loan</Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {item.loans.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    No loan history recorded for this item yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

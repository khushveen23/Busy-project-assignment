'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Search, Download, CheckSquare, Plus, ChevronLeft, ChevronRight, BookOpen, Filter, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { formatDate, getDisplayStatus, isOverdue } from '@/lib/utils'

interface Loan {
  id: string
  status: 'REQUESTED' | 'ISSUED' | 'RETURNED' | 'LOST'
  requestedAt: string
  issuedAt?: string
  dueDate?: string
  returnedAt?: string
  item: { id: string; title: string; code: string; category: string }
  borrower: { id: string; name: string; email: string }
  issuedBy?: { id: string; name: string }
}

export default function LoansPage() {
  const { data: session } = useSession()
  const isLibrarian = session?.user?.role === 'LIBRARIAN'

  const [loans, setLoans] = useState<Loan[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('requestedAt')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  function loadLoans() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    params.set('sort', sortBy)
    params.set('order', sortOrder)
    params.set('page', page.toString())
    params.set('limit', '10')

    fetch(`/api/loans?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setLoans(data.loans || [])
        setTotal(data.total || 0)
        setTotalPages(data.pages || 1)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadLoans()
  }, [search, statusFilter, sortBy, sortOrder, page])

  function handleExportCsv() {
    window.open('/api/loans/export', '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Loan Management</h1>
          <p className="text-muted-foreground mt-1">Search, filter, and track loan requests across the library catalogue.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="w-4 h-4 mr-2" /> Export Active Loans CSV
          </Button>

          {isLibrarian && (
            <Link href="/loans/bulk-return">
              <Button variant="outline" size="sm">
                <CheckSquare className="w-4 h-4 mr-2 text-emerald-400" /> Bulk Return
              </Button>
            </Link>
          )}

          <Link href="/loans/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" /> New Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Goal 6 Requirements: Text search over item title & borrower, filters for status, sorting by due date / requested date / status, server pagination showing total matches */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search item or borrower..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">All Statuses</option>
            <option value="REQUESTED">Requested</option>
            <option value="ISSUED">Issued</option>
            <option value="RETURNED">Returned</option>
            <option value="LOST">Lost</option>
          </Select>

          {/* Sort Field */}
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="requestedAt">Sort by Date Requested</option>
            <option value="dueDate">Sort by Due Date</option>
            <option value="status">Sort by Status</option>
          </Select>

          {/* Sort Order */}
          <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </Select>
        </div>
      </Card>

      {/* Loan List Table */}
      <Card>
        <div className="p-4 border-b border-border flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span>Showing matches {total > 0 ? (page - 1) * 10 + 1 : 0} - {Math.min(page * 10, total)} of {total} total loans</span>
          <span>Page {page} of {totalPages}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading loans...</div>
        ) : loans.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-semibold text-foreground">No loans found</p>
            <p className="text-sm mt-1">Try adjusting search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3.5 font-medium">Catalogue Item</th>
                  <th className="p-3.5 font-medium">Borrower</th>
                  <th className="p-3.5 font-medium">Status</th>
                  <th className="p-3.5 font-medium">Requested</th>
                  <th className="p-3.5 font-medium">Issued / Due Date</th>
                  <th className="p-3.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loans.map((loan) => {
                  const overdue = isOverdue(loan.status, loan.dueDate)
                  return (
                    <tr key={loan.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-foreground">{loan.item.title}</div>
                        <div className="text-xs text-muted-foreground font-mono">{loan.item.code} • {loan.item.category}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-foreground">{loan.borrower.name}</div>
                        <div className="text-xs text-muted-foreground">{loan.borrower.email}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          overdue ? 'status-overdue' : `status-${loan.status.toLowerCase()}`
                        }`}>
                          {getDisplayStatus(loan.status, loan.dueDate)}
                        </span>
                      </td>
                      <td className="p-3.5 text-muted-foreground text-xs">{formatDate(loan.requestedAt)}</td>
                      <td className="p-3.5 text-xs">
                        {loan.issuedAt ? (
                          <div>
                            <div>Issued: {formatDate(loan.issuedAt)}</div>
                            <div className="font-semibold text-foreground">Due: {formatDate(loan.dueDate)}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Not issued yet</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <Link href={`/loans/${loan.id}`}>
                          <Button variant="ghost" size="sm">Details</Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>

            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

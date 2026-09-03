'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Package, AlertTriangle, CheckCircle2, Layers, ShieldCheck, ArrowRight, RefreshCw, BookOpen, Plus, Clock } from 'lucide-react'
import Link from 'next/link'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts'
import { Button } from '@/components/ui/button'
import { formatDate, getDisplayStatus, isOverdue } from '@/lib/utils'

interface DashboardData {
  isLibrarian: boolean
  // Librarian data
  headline?: {
    itemsOut: number
    itemsOverdue: number
    returnedThisWeek: number
    totalItems: number
  }
  statusBreakdown?: {
    REQUESTED: number
    ISSUED: number
    OVERDUE: number
    RETURNED: number
    LOST: number
  }
  custodianBreakdown?: {
    id: string
    name: string
    email: string
    itemCount: number
    activeLoansCount: number
    overdueCount: number
  }[]
  weeklyReturns?: {
    weekLabel: string
    count: number
  }[]
  // Member data
  memberHeadline?: {
    myActiveLoans: number
    myOverdueLoans: number
    myPendingRequests: number
    totalAvailableItems: number
  }
  myRecentLoans?: {
    id: string
    status: 'REQUESTED' | 'ISSUED' | 'RETURNED' | 'LOST'
    requestedAt: string
    issuedAt?: string
    dueDate?: string
    returnedAt?: string
    item: { id: string; title: string; code: string; category: string }
  }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  function loadData() {
    setLoading(true)
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!data) return <div>Failed to load dashboard data.</div>

  // ──────────────────────────────────────────────────────────────────────────
  // MEMBER DASHBOARD VIEW
  // ──────────────────────────────────────────────────────────────────────────
  if (!data.isLibrarian && data.memberHeadline) {
    const { myActiveLoans, myOverdueLoans, myPendingRequests, totalAvailableItems } = data.memberHeadline
    const recentLoans = data.myRecentLoans || []

    return (
      <div className="space-y-8">
        {/* Member Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Member Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your active equipment loans, requests, and available catalogue items.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Link href="/loans/new">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" /> Request Item
              </Button>
            </Link>
          </div>
        </div>

        {/* Member Headline Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">My Active Loans</CardTitle>
              <Package className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{myActiveLoans}</div>
              <p className="text-xs text-muted-foreground mt-1">Equipment currently in your possession</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-red-500/20 bg-gradient-to-br from-card via-card to-red-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">My Overdue Items</CardTitle>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${myOverdueLoans > 0 ? 'text-red-500' : 'text-foreground'}`}>
                {myOverdueLoans}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {myOverdueLoans > 0 ? 'Please return to library shelf promptly' : 'No overdue equipment'}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-blue-500/20 bg-gradient-to-br from-card via-card to-blue-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
              <Clock className="w-5 h-5 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">{myPendingRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting librarian approval & issue</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Catalogue Equipment</CardTitle>
              <Layers className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalAvailableItems}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <Link href="/items" className="text-primary hover:underline flex items-center gap-1">
                  Browse catalogue <ArrowRight className="w-3 h-3" />
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Member Recent Loans Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                My Loan History & Requests
              </CardTitle>
              <CardDescription>Track the status of your equipment requests and borrowed items</CardDescription>
            </div>
            <Link href="/loans">
              <Button variant="ghost" size="sm">
                View All My Loans <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentLoans.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-semibold text-foreground">No loans requested yet</p>
                <p className="text-sm mt-1 max-w-sm mx-auto">
                  You haven't requested any items from the library yet. Browse our shared equipment catalogue to make your first request.
                </p>
                <div className="mt-4">
                  <Link href="/items">
                    <Button size="sm">Browse Equipment Catalogue</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-muted-foreground bg-muted/30">
                    <tr>
                      <th className="p-3 font-medium">Catalogue Item</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Requested</th>
                      <th className="p-3 font-medium">Due Date</th>
                      <th className="p-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentLoans.map((loan) => {
                      const overdue = isOverdue(loan.status, loan.dueDate)
                      return (
                        <tr key={loan.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-foreground">{loan.item.title}</div>
                            <div className="text-xs text-muted-foreground font-mono">{loan.item.code} • {loan.item.category}</div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              overdue ? 'status-overdue' : `status-${loan.status.toLowerCase()}`
                            }`}>
                              {getDisplayStatus(loan.status, loan.dueDate)}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">{formatDate(loan.requestedAt)}</td>
                          <td className="p-3 text-xs">
                            {loan.dueDate ? (
                              <span className={overdue ? 'text-red-400 font-bold' : ''}>
                                {formatDate(loan.dueDate)} {overdue && '(OVERDUE)'}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">Pending issue</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
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
          </CardContent>
        </Card>
      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // LIBRARIAN DASHBOARD VIEW (Goal 8)
  // ──────────────────────────────────────────────────────────────────────────
  const statusChartData = data.statusBreakdown ? [
    { name: 'Requested', count: data.statusBreakdown.REQUESTED, fill: '#3b82f6' },
    { name: 'Issued', count: data.statusBreakdown.ISSUED, fill: '#10b981' },
    { name: 'Overdue', count: data.statusBreakdown.OVERDUE, fill: '#ef4444' },
    { name: 'Returned', count: data.statusBreakdown.RETURNED, fill: '#64748b' },
    { name: 'Lost', count: data.statusBreakdown.LOST, fill: '#f97316' },
  ] : []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">System Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time status of catalogue, active loans, and overdue alerts.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/loans/new">
            <Button size="sm">New Loan Request</Button>
          </Link>
        </div>
      </div>

      {/* Headline Metric Cards */}
      {data.headline && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Items Currently Out</CardTitle>
              <Package className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.headline.itemsOut}</div>
              <p className="text-xs text-muted-foreground mt-1">Active loans on items</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-red-500/20 bg-gradient-to-br from-card via-card to-red-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Items Overdue</CardTitle>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{data.headline.itemsOverdue}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.headline.itemsOverdue > 0 ? (
                  <Link href="/alerts" className="text-red-400 underline flex items-center gap-1">
                    View alerts <ArrowRight className="w-3 h-3" />
                  </Link>
                ) : (
                  'No overdue loans'
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-card via-card to-emerald-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Returned This Week</CardTitle>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">{data.headline.returnedThisWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">Processed in last 7 days</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Catalogue Items</CardTitle>
              <Layers className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.headline.totalItems}</div>
              <p className="text-xs text-muted-foreground mt-1">Active registered assets</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Returns Chart */}
        {data.weeklyReturns && (
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Items Returned Per Week (Last 8 Weeks)</CardTitle>
              <CardDescription>Trend of loan returns completed over time</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.weeklyReturns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="weekLabel" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Loan Breakdown by Status */}
        {statusChartData.length > 0 && (
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Loans Breakdown by Status</CardTitle>
              <CardDescription>Current snapshot across all lifecycle states</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Custodian Breakdown Table */}
      {data.custodianBreakdown && (
        <Card className="p-6">
          <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Loans Breakdown by Custodian
              </CardTitle>
              <CardDescription>Librarians responsible for equipment condition & location</CardDescription>
            </div>
            <Link href="/my-items">
              <Button variant="ghost" size="sm">
                My Custodian Items <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-0 pb-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-3 font-medium">Librarian Custodian</th>
                  <th className="pb-3 font-medium">Assigned Items</th>
                  <th className="pb-3 font-medium">Active Loans</th>
                  <th className="pb-3 font-medium">Overdue Loans</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.custodianBreakdown.map((custodian) => (
                  <tr key={custodian.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3">
                      <div className="font-semibold">{custodian.name}</div>
                      <div className="text-xs text-muted-foreground">{custodian.email}</div>
                    </td>
                    <td className="py-3">{custodian.itemCount} items</td>
                    <td className="py-3 font-medium text-emerald-400">{custodian.activeLoansCount} active</td>
                    <td className="py-3 font-medium">
                      {custodian.overdueCount > 0 ? (
                        <span className="text-red-400">{custodian.overdueCount} overdue</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                  </tr>
                ))}
                {data.custodianBreakdown.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted-foreground">
                      No librarians found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Plus, Upload, Search, Archive, ArchiveRestore, Package, ShieldCheck, Eye, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface CatalogueItem {
  id: string
  title: string
  category: string
  code: string
  archived: boolean
  custodians: { id: string; name: string; email: string }[]
  loans: { id: string; status: string }[]
  _count: { loans: number }
}

export default function CataloguePage() {
  const { data: session } = useSession()
  const isLibrarian = session?.user?.role === 'LIBRARIAN'

  const [items, setItems] = useState<CatalogueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  function loadItems() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (showArchived) params.set('archived', 'true')

    fetch(`/api/items?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadItems()
  }, [search, showArchived])

  async function handleToggleArchive(id: string, currentArchived: boolean) {
    if (!confirm(`Are you sure you want to ${currentArchived ? 'restore' : 'archive'} this item?`)) return

    await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: !currentArchived }),
    })
    loadItems()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Catalogue Items</h1>
          <p className="text-muted-foreground mt-1">Browse, search, and manage lending library assets.</p>
        </div>
        {isLibrarian && (
          <div className="flex items-center gap-3">
            <Link href="/items/import">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
            </Link>
            <Link href="/items/new">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Controls */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search title, category, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            Show archived items
          </label>
        </div>
      </Card>

      {/* Item List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading catalogue...</div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-semibold text-foreground">No items found</p>
          <p className="text-sm mt-1">Try refining your search or add a new catalogue item.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const hasOpenLoan = item.loans && item.loans.length > 0
            return (
              <Card
                key={item.id}
                className={`p-5 flex flex-col justify-between transition-all hover:border-primary/50 ${
                  item.archived ? 'opacity-60 bg-muted/20 border-dashed' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {item.code}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {item.archived && <Badge variant="secondary">Archived</Badge>}
                      {hasOpenLoan ? (
                        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">In Use / Loaned</Badge>
                      ) : (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Available</Badge>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-lg line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">{item.category}</p>

                  {/* Custodians */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="truncate">
                      {item.custodians.length > 0
                        ? `Custodians: ${item.custodians.map((c) => c.name).join(', ')}`
                        : 'No assigned custodians'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-border flex items-center justify-between gap-2">
                  <Link href={`/items/${item.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1.5" /> View
                    </Button>
                  </Link>

                  <div className="flex items-center gap-1">
                    {!isLibrarian && !item.archived && !hasOpenLoan && (
                      <Link href={`/loans/new?itemId=${item.id}`}>
                        <Button size="sm">Request</Button>
                      </Link>
                    )}

                    {isLibrarian && (
                      <>
                        <Link href={`/items/${item.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleArchive(item.id, item.archived)}
                          title={item.archived ? 'Restore' : 'Archive'}
                        >
                          {item.archived ? (
                            <ArchiveRestore className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Archive className="w-4 h-4 text-muted-foreground hover:text-red-400" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

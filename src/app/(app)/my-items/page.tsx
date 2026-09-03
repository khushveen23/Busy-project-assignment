'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FolderHeart, Eye, ShieldCheck, RefreshCw, Package } from 'lucide-react'

interface Item {
  id: string
  title: string
  category: string
  code: string
  archived: boolean
  custodians: { id: string; name: string }[]
  loans: { id: string; status: string }[]
}

export default function MyItemsPage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  function loadMyItems() {
    setLoading(true)
    fetch('/api/items')
      .then((res) => res.json())
      .then((data: Item[]) => {
        if (Array.isArray(data)) {
          // Filter items where logged in user is a custodian
          const myCustodianItems = data.filter((item) =>
            item.custodians.some((c) => c.id === session?.user?.id)
          )
          setItems(myCustodianItems)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (session?.user?.id) {
      loadMyItems()
    }
  }, [session?.user?.id])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight">My Custodian Items</h1>
            <Badge variant="outline" className="text-xs">{items.length} Assigned</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Catalogue assets you are personally responsible for regarding condition and physical location.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadMyItems}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading your assigned custodian items...</div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <FolderHeart className="w-12 h-12 mx-auto mb-3 opacity-40 text-primary" />
          <p className="text-lg font-semibold text-foreground">No custodian items assigned</p>
          <p className="text-sm mt-1">
            You are not currently assigned as a custodian for any catalogue items. Assign custodians on any item detail page.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const hasOpenLoan = item.loans && item.loans.length > 0
            return (
              <Card key={item.id} className="p-5 flex flex-col justify-between hover:border-primary/50 transition-all">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {item.code}
                    </Badge>
                    {hasOpenLoan ? (
                      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">In Use</Badge>
                    ) : (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Available</Badge>
                    )}
                  </div>

                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">{item.category}</p>

                  <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Custodian: You ({session?.user?.name})</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
                  <Link href={`/items/${item.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1.5" /> View Item Details
                    </Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

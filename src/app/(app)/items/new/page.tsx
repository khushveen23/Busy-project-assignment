'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'

export default function NewItemPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, code }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create item.')
        setLoading(false)
        return
      }

      router.push(`/items/${data.id}`)
    } catch {
      setError('An unexpected error occurred.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/items" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Catalogue
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Create Catalogue Item</h1>
        <p className="text-muted-foreground mt-1">Register a new asset in the lending library catalogue.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
          <CardDescription>Enter the title, category, and unique asset code.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <Input
                id="title"
                placeholder="e.g. Sony A7 III Camera"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">Category</label>
              <Input
                id="category"
                placeholder="e.g. Photography, AV Equipment, Tools"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">Unique Item Code</label>
              <Input
                id="code"
                placeholder="e.g. CAM-003"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono"
                required
              />
              <p className="text-xs text-muted-foreground">Must be a unique code identifying this specific asset.</p>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Link href="/items">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" loading={loading}>
                <Plus className="w-4 h-4 mr-2" />
                Create Item
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

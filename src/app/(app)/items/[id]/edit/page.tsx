'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function EditItemPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/items/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          setError('Item not found.')
          setLoading(false)
          return
        }
        const data = await res.json()
        if (data && data.id) {
          setTitle(data.title)
          setCategory(data.category)
          setCode(data.code)
        } else {
          setError(data.error || 'Failed to fetch item.')
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to fetch item.')
        setLoading(false)
      })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, code }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update item.')
        setSaving(false)
        return
      }

      router.push(`/items/${id}`)
    } catch {
      setError('An unexpected error occurred.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href={`/items/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Item Details
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Edit Item</h1>
        <p className="text-muted-foreground mt-1">Update title, category, or item code.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Catalogue Details</CardTitle>
          <CardDescription>Modify asset records in the system.</CardDescription>
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">Category</label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">Unique Item Code</label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono"
                required
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Link href={`/items/${id}`}>
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" loading={saving}>
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

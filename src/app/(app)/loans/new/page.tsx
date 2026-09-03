'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'

interface ItemOption {
  id: string
  title: string
  code: string
  category: string
  archived: boolean
  loans: { status: string }[]
}

interface UserOption {
  id: string
  name: string
  email: string
  role: string
}

export default function NewLoanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultItemId = searchParams.get('itemId') || ''
  const { data: session } = useSession()
  const isLibrarian = session?.user?.role === 'LIBRARIAN'

  const [items, setItems] = useState<ItemOption[]>([])
  const [members, setMembers] = useState<UserOption[]>([])
  const [selectedItem, setSelectedItem] = useState(defaultItemId)
  const [selectedBorrower, setSelectedBorrower] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/items')
      .then((res) => res.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})

    if (isLibrarian) {
      fetch('/api/members')
        .then((res) => res.json())
        .then((data) => setMembers(Array.isArray(data) ? data : []))
        .catch(() => {})
    }
  }, [isLibrarian])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedItem) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItem,
          borrowerId: isLibrarian ? selectedBorrower : undefined,
          note,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to submit loan request.')
        setLoading(false)
        return
      }

      router.push(`/loans/${data.id}`)
    } catch {
      setError('An unexpected error occurred.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/loans" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Loans
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">New Loan Request</h1>
        <p className="text-muted-foreground mt-1">Submit a loan request for a catalogue item.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>Select the item you want to borrow and specify details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                {error}
              </div>
            )}

            {/* Select Item */}
            <div className="space-y-2">
              <label htmlFor="item" className="text-sm font-medium">Catalogue Item</label>
              <Select
                id="item"
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                required
              >
                <option value="">Select an available catalogue item...</option>
                {items.map((item) => {
                  const hasLoan = item.loans && item.loans.length > 0
                  return (
                    <option key={item.id} value={item.id} disabled={hasLoan || item.archived}>
                      {item.code} — {item.title} ({item.category}) {hasLoan ? '[ON LOAN]' : ''} {item.archived ? '[ARCHIVED]' : ''}
                    </option>
                  )
                })}
              </Select>
            </div>

            {/* Select Borrower (Librarians only) */}
            {isLibrarian && (
              <div className="space-y-2">
                <label htmlFor="borrower" className="text-sm font-medium">Borrower</label>
                <Select
                  id="borrower"
                  value={selectedBorrower}
                  onChange={(e) => setSelectedBorrower(e.target.value)}
                >
                  <option value="">Myself ({session?.user?.name})</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email}) [{member.role.toLowerCase()}]
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-muted-foreground">Librarians can create loans directly on behalf of any member.</p>
              </div>
            )}

            {/* Optional Note */}
            <div className="space-y-2">
              <label htmlFor="note" className="text-sm font-medium">Initial Note (Optional)</label>
              <Textarea
                id="note"
                placeholder="Add context or notes for the loan request..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Link href="/loans">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" loading={loading} disabled={!selectedItem}>
                <Send className="w-4 h-4 mr-2" /> Submit Loan Request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

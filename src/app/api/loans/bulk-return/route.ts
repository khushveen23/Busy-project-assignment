import { NextRequest, NextResponse } from 'next/server'
import { requireLibrarian } from '@/lib/auth'
import { transitionLoan } from '@/lib/loan-rules'

export async function POST(req: NextRequest) {
  try {
    const session = await requireLibrarian()
    const { loanIds } = await req.json()

    if (!Array.isArray(loanIds) || loanIds.length === 0) {
      return NextResponse.json({ error: 'loanIds array is required' }, { status: 400 })
    }

    const results: { loanId: string; status: 'ok' | 'error'; error?: string }[] = []

    for (const loanId of loanIds) {
      const { error } = await transitionLoan(loanId, 'return', session.user.id)
      if (error) {
        results.push({ loanId, status: 'error', error })
      } else {
        results.push({ loanId, status: 'ok' })
      }
    }

    return NextResponse.json({
      total: loanIds.length,
      succeeded: results.filter(r => r.status === 'ok').length,
      failed: results.filter(r => r.status === 'error').length,
      results,
    })
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Bulk return failed' }, { status: 500 })
  }
}

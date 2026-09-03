import { NextRequest, NextResponse } from 'next/server'
import { requireLibrarian } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ loanId: string }> | { loanId: string } }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireLibrarian()
    const { loanId } = await params

    // Check loan exists and is currently overdue
    const loan = await prisma.loan.findUnique({ where: { id: loanId } })
    if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 })

    await prisma.overdueAlertDismissal.upsert({
      where: { loanId },
      update: { dismissedById: session.user.id, dismissedAt: new Date() },
      create: { loanId, dismissedById: session.user.id },
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Failed to dismiss alert' }, { status: 500 })
  }
}

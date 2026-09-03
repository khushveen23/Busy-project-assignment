import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireLibrarian } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { transitionLoan } from '@/lib/loan-rules'

type Params = { params: Promise<{ id: string }> | { id: string } }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        item: { select: { id: true, title: true, code: true, category: true, custodians: { select: { id: true, name: true, email: true } } } },
        borrower: { select: { id: true, name: true, email: true } },
        issuedBy: { select: { id: true, name: true } },
        processedBy: { select: { id: true, name: true } },
        events: {
          include: { actor: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        dismissals: true,
      },
    })
    if (!loan) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Goal 1: Members can only see their own loans
    if (session.user.role === 'MEMBER' && loan.borrowerId !== session.user.id) {
      return NextResponse.json({ error: 'You are not authorized to view this loan.' }, { status: 403 })
    }

    return NextResponse.json(loan)
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Failed to fetch loan' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireLibrarian()
    const { id } = await params
    const body = await req.json()
    const { action, dueDate, note } = body

    if (!['issue', 'return', 'lost', 'note'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })
    }

    if (action === 'note') {
      if (!note?.trim()) return NextResponse.json({ error: 'Note is required.' }, { status: 400 })
      await prisma.loanEvent.create({
        data: { loanId: id, actorId: session.user.id, eventType: 'NOTE', note },
      })
      return NextResponse.json({ ok: true })
    }

    const { error } = await transitionLoan(
      id,
      action as 'issue' | 'return' | 'lost',
      session.user.id,
      { dueDate: dueDate ? new Date(dueDate) : undefined, note }
    )

    if (error) return NextResponse.json({ error }, { status: 409 })

    const updated = await prisma.loan.findUnique({
      where: { id },
      include: {
        item: { select: { id: true, title: true, code: true } },
        borrower: { select: { id: true, name: true, email: true } },
      },
    })
    return NextResponse.json(updated)
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Failed to update loan' }, { status: 500 })
  }
}

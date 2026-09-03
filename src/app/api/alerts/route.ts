import { NextRequest, NextResponse } from 'next/server'
import { requireLibrarian } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LoanStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    await requireLibrarian()

    const now = new Date()

    const overdueLoans = await prisma.loan.findMany({
      where: {
        status: LoanStatus.ISSUED,
        dueDate: { lt: now },
        dismissals: { none: {} },
      },
      include: {
        item: { select: { id: true, title: true, code: true } },
        borrower: { select: { id: true, name: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json(overdueLoans)
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

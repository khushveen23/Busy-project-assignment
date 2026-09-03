import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LoanStatus } from '@prisma/client'
import { formatDate } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    await requireAuth()

    const loans = await prisma.loan.findMany({
      where: { status: LoanStatus.ISSUED },
      include: {
        item: { select: { title: true, code: true, category: true } },
        borrower: { select: { name: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
    })

    const now = new Date()
    const rows = loans.map((l: any) => ({
      item_title: l.item.title,
      item_code: l.item.code,
      category: l.item.category,
      borrower_name: l.borrower.name,
      borrower_email: l.borrower.email,
      issued_date: formatDate(l.issuedAt),
      due_date: formatDate(l.dueDate),
      overdue: l.dueDate && new Date(l.dueDate) < now ? 'Yes' : 'No',
    }))

    const headers = ['item_title', 'item_code', 'category', 'borrower_name', 'borrower_email', 'issued_date', 'due_date', 'overdue']
    const csv = [
      headers.join(','),
      ...rows.map((r: any) => headers.map(h => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="active-loans-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LoanStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(req.url)

    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const itemId = searchParams.get('itemId') || ''
    const borrowerId = searchParams.get('borrowerId') || ''
    const sort = searchParams.get('sort') || 'requestedAt'
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))
    const skip = (page - 1) * limit

    const where: any = {}

    // Goal 1: Members can only see their own loans; Librarians can see all or filter by borrower
    if (session.user.role === 'MEMBER') {
      where.borrowerId = session.user.id
    } else if (borrowerId) {
      where.borrowerId = borrowerId
    }

    if (status && Object.values(LoanStatus).includes(status as LoanStatus)) {
      where.status = status as LoanStatus
    }
    if (itemId) where.itemId = itemId

    if (search) {
      where.OR = [
        { item: { title: { contains: search, mode: 'insensitive' } } },
        { borrower: { name: { contains: search, mode: 'insensitive' } } },
        { borrower: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const validSorts = ['requestedAt', 'dueDate', 'status'] as const
    const sortField = validSorts.includes(sort as any) ? sort : 'requestedAt'

    const [loans, total] = await prisma.$transaction([
      prisma.loan.findMany({
        where,
        include: {
          item: { select: { id: true, title: true, code: true, category: true } },
          borrower: { select: { id: true, name: true, email: true } },
          issuedBy: { select: { id: true, name: true } },
        },
        orderBy: { [sortField]: order },
        skip,
        take: limit,
      }),
      prisma.loan.count({ where }),
    ])

    return NextResponse.json({ loans, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const { itemId, borrowerId, note } = body

    if (!itemId) return NextResponse.json({ error: 'itemId is required' }, { status: 400 })

    const actualBorrowerId = session.user.role === 'MEMBER' ? session.user.id : (borrowerId || session.user.id)

    const item = await prisma.catalogueItem.findUnique({ where: { id: itemId } })
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    if (item.archived) return NextResponse.json({ error: 'Cannot request an archived item.' }, { status: 400 })

    const openLoan = await prisma.loan.findFirst({
      where: { itemId, status: { in: [LoanStatus.REQUESTED, LoanStatus.ISSUED] } },
    })
    if (openLoan) {
      return NextResponse.json({
        error: `"${item.title}" already has an open loan and cannot be requested again.`,
      }, { status: 409 })
    }

    const loan = await prisma.$transaction(async (tx: any) => {
      const loan = await tx.loan.create({
        data: {
          itemId,
          borrowerId: actualBorrowerId,
          status: LoanStatus.REQUESTED,
        },
        include: {
          item: { select: { id: true, title: true, code: true } },
          borrower: { select: { id: true, name: true, email: true } },
        },
      })

      await tx.loanEvent.create({
        data: {
          loanId: loan.id,
          actorId: session.user.id,
          eventType: 'REQUESTED',
          note,
        },
      })

      return loan
    })

    return NextResponse.json(loan, { status: 201 })
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Failed to create loan' }, { status: 500 })
  }
}

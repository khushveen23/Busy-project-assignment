import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LoanStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const now = new Date()
    const isLibrarian = session.user.role === 'LIBRARIAN'

    if (!isLibrarian) {
      // Member-scoped dashboard: Shows only the user's personal loans & requests
      const [myActiveLoans, myOverdueLoans, myPendingRequests, totalAvailableItems, myRecentLoans] = await Promise.all([
        prisma.loan.count({
          where: { borrowerId: session.user.id, status: LoanStatus.ISSUED },
        }),
        prisma.loan.count({
          where: { borrowerId: session.user.id, status: LoanStatus.ISSUED, dueDate: { lt: now } },
        }),
        prisma.loan.count({
          where: { borrowerId: session.user.id, status: LoanStatus.REQUESTED },
        }),
        prisma.catalogueItem.count({ where: { archived: false } }),
        prisma.loan.findMany({
          where: { borrowerId: session.user.id },
          include: {
            item: { select: { id: true, title: true, code: true, category: true } },
          },
          orderBy: { requestedAt: 'desc' },
          take: 10,
        }),
      ])

      return NextResponse.json({
        isLibrarian: false,
        memberHeadline: {
          myActiveLoans,
          myOverdueLoans,
          myPendingRequests,
          totalAvailableItems,
        },
        myRecentLoans,
      })
    }

    // Librarian-scoped dashboard: System-wide overview
    const [itemsOut, itemsOverdue, totalItems] = await Promise.all([
      prisma.loan.count({ where: { status: LoanStatus.ISSUED } }),
      prisma.loan.count({ where: { status: LoanStatus.ISSUED, dueDate: { lt: now } } }),
      prisma.catalogueItem.count({ where: { archived: false } }),
    ])

    // Loans returned this week (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const returnedThisWeek = await prisma.loan.count({
      where: {
        status: LoanStatus.RETURNED,
        returnedAt: { gte: sevenDaysAgo },
      },
    })

    // 2. Breakdown by status
    const statusCounts = await prisma.loan.groupBy({
      by: ['status'],
      _count: { _all: true },
    })

    const statusBreakdown = {
      REQUESTED: 0,
      ISSUED: 0,
      OVERDUE: itemsOverdue,
      RETURNED: 0,
      LOST: 0,
    }

    statusCounts.forEach((sc: { status: LoanStatus; _count: { _all: number } }) => {
      if (sc.status === LoanStatus.ISSUED) {
        statusBreakdown.ISSUED = sc._count._all - itemsOverdue
      } else if (sc.status in statusBreakdown) {
        statusBreakdown[sc.status as keyof typeof statusBreakdown] = sc._count._all
      }
    })

    // 3. Breakdown by custodian
    const librarians = await prisma.user.findMany({
      where: { role: 'LIBRARIAN' },
      select: {
        id: true,
        name: true,
        email: true,
        custodianOf: {
          select: {
            id: true,
            loans: {
              where: { status: { in: [LoanStatus.REQUESTED, LoanStatus.ISSUED] } },
              select: { id: true, status: true, dueDate: true },
            },
          },
        },
      },
    })

    const custodianBreakdown = librarians.map((lib: any) => {
      let activeLoansCount = 0
      let overdueCount = 0
      lib.custodianOf.forEach((item: any) => {
        activeLoansCount += item.loans.length
        item.loans.forEach((loan: any) => {
          if (loan.status === LoanStatus.ISSUED && loan.dueDate && new Date(loan.dueDate) < now) {
            overdueCount++
          }
        })
      })
      return {
        id: lib.id,
        name: lib.name,
        email: lib.email,
        itemCount: lib.custodianOf.length,
        activeLoansCount,
        overdueCount,
      }
    })

    // 4. Items returned per week over the last 8 weeks
    const eightWeeksData: { weekLabel: string; count: number }[] = []
    for (let i = 7; i >= 0; i--) {
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - (i + 1) * 7)
      startOfWeek.setHours(0, 0, 0, 0)

      const endOfWeek = new Date()
      endOfWeek.setDate(endOfWeek.getDate() - i * 7)
      endOfWeek.setHours(23, 59, 59, 999)

      const count = await prisma.loan.count({
        where: {
          status: LoanStatus.RETURNED,
          returnedAt: {
            gte: startOfWeek,
            lte: endOfWeek,
          },
        },
      })

      const weekLabel = `W${8 - i}`
      eightWeeksData.push({ weekLabel, count })
    }

    return NextResponse.json({
      isLibrarian: true,
      headline: {
        itemsOut,
        itemsOverdue,
        returnedThisWeek,
        totalItems,
      },
      statusBreakdown,
      custodianBreakdown,
      weeklyReturns: eightWeeksData,
    })
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}

import { LoanStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type LoanTransition = 'issue' | 'return' | 'lost'

/** Validate and execute a loan state transition. Returns error string or null on success. */
export async function transitionLoan(
  loanId: string,
  transition: LoanTransition,
  actorId: string,
  data?: { dueDate?: Date; note?: string }
): Promise<{ error: string | null }> {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { item: true },
  })

  if (!loan) return { error: 'Loan not found.' }

  if (transition === 'issue') {
    if (loan.status !== LoanStatus.REQUESTED) {
      return { error: `Cannot issue a loan that is already ${loan.status.toLowerCase()}.` }
    }

    // Check for any open loan on the same item
    const openLoan = await prisma.loan.findFirst({
      where: {
        itemId: loan.itemId,
        id: { not: loanId },
        status: { in: [LoanStatus.REQUESTED, LoanStatus.ISSUED] },
      },
    })
    if (openLoan) {
      return { error: `"${loan.item.title}" already has an open loan (${openLoan.status.toLowerCase()}). It must be returned before issuing again.` }
    }

    if (!data?.dueDate) return { error: 'A due date is required to issue a loan.' }

    await prisma.$transaction([
      prisma.loan.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.ISSUED,
          issuedAt: new Date(),
          dueDate: data.dueDate,
          issuedById: actorId,
        },
      }),
      prisma.loanEvent.create({
        data: {
          loanId,
          actorId,
          eventType: 'ISSUED',
          note: data?.note,
        },
      }),
    ])
    return { error: null }
  }

  if (transition === 'return') {
    if (loan.status !== LoanStatus.ISSUED) {
      return { error: `Cannot return a loan that is ${loan.status.toLowerCase()}, not issued.` }
    }

    await prisma.$transaction([
      prisma.loan.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.RETURNED,
          returnedAt: new Date(),
          processedById: actorId,
        },
      }),
      prisma.loanEvent.create({
        data: { loanId, actorId, eventType: 'RETURNED', note: data?.note },
      }),
    ])
    return { error: null }
  }

  if (transition === 'lost') {
    if (loan.status !== LoanStatus.ISSUED) {
      return { error: `Cannot mark as lost a loan that is ${loan.status.toLowerCase()}, not issued.` }
    }

    await prisma.$transaction([
      prisma.loan.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.LOST,
          lostAt: new Date(),
          processedById: actorId,
        },
      }),
      prisma.loanEvent.create({
        data: { loanId, actorId, eventType: 'LOST', note: data?.note },
      }),
    ])
    return { error: null }
  }

  return { error: 'Unknown transition.' }
}

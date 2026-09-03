import { NextRequest, NextResponse } from 'next/server'
import { requireLibrarian } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LoanStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    await requireLibrarian()
    const now = new Date()
    const count = await prisma.loan.count({
      where: {
        status: LoanStatus.ISSUED,
        dueDate: { lt: now },
        dismissals: { none: {} },
      },
    })
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}

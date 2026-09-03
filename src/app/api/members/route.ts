import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    await requireAuth()
    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')

    const users = await prisma.user.findMany({
      where: role ? { role: role as 'LIBRARIAN' | 'MEMBER' } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            loans: true,
            custodianOf: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(users)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

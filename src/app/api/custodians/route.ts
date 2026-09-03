import { NextRequest, NextResponse } from 'next/server'
import { requireLibrarian } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    await requireLibrarian()
    const { itemId, librarianId } = await req.json()

    if (!itemId || !librarianId) {
      return NextResponse.json({ error: 'itemId and librarianId are required' }, { status: 400 })
    }

    const updated = await prisma.catalogueItem.update({
      where: { id: itemId },
      data: {
        custodians: {
          connect: { id: librarianId },
        },
      },
      include: {
        custodians: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Failed to assign custodian' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireLibrarian()
    const { itemId, librarianId } = await req.json()

    if (!itemId || !librarianId) {
      return NextResponse.json({ error: 'itemId and librarianId are required' }, { status: 400 })
    }

    const updated = await prisma.catalogueItem.update({
      where: { id: itemId },
      data: {
        custodians: {
          disconnect: { id: librarianId },
        },
      },
      include: {
        custodians: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Failed to remove custodian' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { requireLibrarian } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> | { id: string } }

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params
  const item = await prisma.catalogueItem.findUnique({
    where: { id },
    include: {
      custodians: { select: { id: true, name: true, email: true, role: true } },
      loans: {
        include: {
          borrower: { select: { id: true, name: true, email: true } },
          issuedBy: { select: { id: true, name: true } },
        },
        orderBy: { requestedAt: 'desc' },
      },
    },
  })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireLibrarian()
    const { id } = await params
    const body = await req.json()
    const { title, category, code } = body

    if (!title?.trim() || !category?.trim() || !code?.trim()) {
      return NextResponse.json({ error: 'title, category and code are required' }, { status: 400 })
    }

    const conflict = await prisma.catalogueItem.findFirst({
      where: { code: code.trim(), id: { not: id } },
    })
    if (conflict) return NextResponse.json({ error: `Code "${code}" is already in use.` }, { status: 409 })

    const item = await prisma.catalogueItem.update({
      where: { id },
      data: { title: title.trim(), category: category.trim(), code: code.trim() },
    })
    return NextResponse.json(item)
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireLibrarian()
    const { id } = await params
    const { archived } = await req.json()

    const item = await prisma.catalogueItem.update({
      where: { id },
      data: { archived: Boolean(archived) },
    })
    return NextResponse.json(item)
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Failed to archive/restore' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { requireLibrarian } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const includeArchived = searchParams.get('archived') === 'true'
    const search = searchParams.get('search') || ''

    const items = await prisma.catalogueItem.findMany({
      where: {
        archived: includeArchived ? undefined : false,
        OR: search
          ? [
              { title: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: {
        custodians: { select: { id: true, name: true, email: true } },
        _count: { select: { loans: true } },
        loans: {
          where: { status: { in: ['REQUESTED', 'ISSUED'] } },
          select: { id: true, status: true },
        },
      },
      orderBy: { title: 'asc' },
    })

    return NextResponse.json(items)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireLibrarian()
    const body = await req.json()
    const { title, category, code } = body

    if (!title?.trim() || !category?.trim() || !code?.trim()) {
      return NextResponse.json({ error: 'title, category and code are required' }, { status: 400 })
    }

    const existing = await prisma.catalogueItem.findUnique({ where: { code: code.trim() } })
    if (existing) {
      return NextResponse.json({ error: `Code "${code}" is already in use.` }, { status: 409 })
    }

    const item = await prisma.catalogueItem.create({
      data: { title: title.trim(), category: category.trim(), code: code.trim() },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}

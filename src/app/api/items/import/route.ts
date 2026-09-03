import { NextRequest, NextResponse } from 'next/server'
import { requireLibrarian } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'

interface CsvRow {
  title?: string
  category?: string
  code?: string
  [key: string]: string | undefined
}

export async function POST(req: NextRequest) {
  try {
    await requireLibrarian()

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const text = await file.text()
    const { data, errors: parseErrors } = Papa.parse<CsvRow>(text, {
      header: true,
      skipEmptyLines: true,
    })

    if (parseErrors.length > 0) {
      return NextResponse.json({ error: 'CSV parse error', details: parseErrors }, { status: 400 })
    }

    const results: { row: number; status: 'ok' | 'error'; code?: string; error?: string }[] = []
    let imported = 0

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2 // 1-indexed, +1 for header

      const title = row.title?.trim()
      const category = row.category?.trim()
      const code = row.code?.trim()

      if (!title || !category || !code) {
        results.push({ row: rowNum, status: 'error', error: 'Missing required fields: title, category, code' })
        continue
      }

      try {
        await prisma.catalogueItem.create({ data: { title, category, code } })
        results.push({ row: rowNum, status: 'ok', code })
        imported++
      } catch (e: any) {
        if (e.code === 'P2002') {
          results.push({ row: rowNum, status: 'error', code, error: `Code "${code}" already exists` })
        } else {
          results.push({ row: rowNum, status: 'error', code, error: 'Database error' })
        }
      }
    }

    return NextResponse.json({
      total: data.length,
      imported,
      failed: data.length - imported,
      results,
    })
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}

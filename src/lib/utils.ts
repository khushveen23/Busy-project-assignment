import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { LoanStatus } from '@prisma/client'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isOverdue(status: LoanStatus | string, dueDate: Date | string | null | undefined): boolean {
  if (status !== 'ISSUED') return false
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

export function getDisplayStatus(status: LoanStatus | string, dueDate: Date | string | null | undefined): string {
  if (isOverdue(status, dueDate)) return 'Overdue'
  switch (status) {
    case 'REQUESTED': return 'Requested'
    case 'ISSUED': return 'Issued'
    case 'RETURNED': return 'Returned'
    case 'LOST': return 'Lost'
    default: return String(status)
  }
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

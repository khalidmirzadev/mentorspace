import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import type { AppSettings } from '@/types'

// ── Currency ─────────────────────────────────────────────────────

const DEFAULT_SYMBOL = 'Rs.'

export function formatCurrency(
  amount: number,
  symbol: string = DEFAULT_SYMBOL,
  compact = false
): string {
  if (compact) {
    if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`
    if (amount >= 1_000)     return `${symbol}${(amount / 1_000).toFixed(1)}K`
  }
  return `${symbol}${new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`
}

// ── Dates ────────────────────────────────────────────────────────

export function formatDate(date: string | Date, fmt = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt)
}

export function formatMonth(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMMM yyyy')
}

export function formatMonthShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM yyyy')
}

/** Returns '2025-01-01' (1st of given month) */
export function toBillingMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

/** Returns current billing month as '2025-01-01' */
export function currentBillingMonth(): string {
  const now = new Date()
  return toBillingMonth(now.getFullYear(), now.getMonth() + 1)
}

/**
 * Safely returns { start: 'YYYY-MM-01', end: 'YYYY-MM-DD' } for any billing month string.
 * Completely timezone-independent without UTC offset truncation.
 */
export function getMonthDateRange(billingMonth: string): { start: string; end: string } {
  const [yearStr, monStr] = billingMonth.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monStr, 10) // 1-12

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const mm = String(month).padStart(2, '0')

  return {
    start: `${year}-${mm}-01`,
    end: `${year}-${mm}-${String(daysInMonth).padStart(2, '0')}`,
  }
}

/**
 * Shifts a billing month string by delta months safely without timezone shifts.
 */
export function shiftMonth(billingMonth: string, delta: number): string {
  const [yearStr, monStr] = billingMonth.split('-')
  let year = parseInt(yearStr, 10)
  let month = parseInt(monStr, 10) + delta

  while (month > 12) {
    month -= 12
    year += 1
  }
  while (month < 1) {
    month += 12
    year -= 1
  }

  return toBillingMonth(year, month)
}

/** Check if today is within the payment alert window (e.g. 1st–5th) */
export function isPaymentAlertPeriod(settings: Pick<AppSettings, 'payment_due_day_start' | 'payment_due_day_end'>): boolean {
  const today = new Date().getDate()
  const start = parseInt(settings.payment_due_day_start, 10)
  const end   = parseInt(settings.payment_due_day_end, 10)
  return today >= start && today <= end
}

/** Returns an array of last N months as billing month strings, newest first */
export function getLastNMonths(n: number): string[] {
  const months: string[] = []
  const current = currentBillingMonth()
  for (let i = 0; i < n; i++) {
    months.push(shiftMonth(current, -i))
  }
  return months
}

// ── Numbers / Stats ──────────────────────────────────────────────

export function percentage(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return Math.round((numerator / denominator) * 100)
}

export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0)
}

// ── Status labels ────────────────────────────────────────────────

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending:         'Pending',
  partially_paid:  'Partial',
  paid:            'Paid',
  overdue:         'Overdue',
}

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending:         'warning',
  partially_paid:  'secondary',
  paid:            'success',
  overdue:         'destructive',
}

export const MEMBER_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  left:   'Left',
}

export const SPACE_TYPE_LABELS: Record<string, string> = {
  individual_seat: 'Individual Seat',
  complete_room:   'Complete Room',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash:          'Cash',
  bank_transfer: 'Bank Transfer',
  cheque:        'Cheque',
  online:        'Online',
}

export const GENERATOR_TYPE_LABELS: Record<string, string> = {
  fuel:        'Fuel',
  maintenance: 'Maintenance',
  repair:      'Repair',
  other:       'Other',
}

// ── Misc ─────────────────────────────────────────────────────────

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export function slugify(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

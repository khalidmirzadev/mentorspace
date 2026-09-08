import { createClient } from '@/lib/supabase/server'
import type { DashboardKPIs, MonthlyPLData, ExpenseBreakdownItem } from '@/types'
import { getLastNMonths, formatMonthShort, getMonthDateRange } from '@/lib/utils/formatters'

/**
 * Fetch all KPIs for the dashboard for a given billing month.
 * All numbers come from real DB records — nothing is hardcoded.
 */
export async function getDashboardKPIs(billingMonth: string): Promise<DashboardKPIs> {
  const supabase = await createClient()

  // Parse month range for expense date filtering
  const { start: monthStart, end: monthEnd } = getMonthDateRange(billingMonth)

  const [
    { data: rooms },
    { data: seats },
    { data: members },
    { data: payments },
    { count: occupiedRooms },
    { count: occupiedSeats },
    { data: expensesRaw },
  ] = await Promise.all([
    supabase.from('rooms').select('id').eq('is_active', true),
    supabase.from('seats').select('id').eq('is_active', true),
    supabase.from('members').select('id, status'),
    supabase.from('member_payments')
      .select('amount_due, amount_paid, payment_status')
      .eq('billing_month', billingMonth),
    supabase.from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .not('assigned_room_id', 'is', null),
    supabase.from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .not('assigned_seat_id', 'is', null),
    supabase.from('expenses')
      .select('amount, category:expense_categories(slug)')
      .gte('expense_date', monthStart)
      .lte('expense_date', monthEnd),
  ])

  const totalRooms = rooms?.length ?? 0
  const totalSeats = seats?.length ?? 0
  const oRooms = occupiedRooms ?? 0
  const oSeats = occupiedSeats ?? 0
  const totalSpaces = totalRooms + totalSeats
  const occupiedSpaces = oRooms + oSeats

  const activeMembers = members?.filter(m => m.status === 'active').length ?? 0

  const expectedRevenue    = payments?.reduce((s, p) => s + p.amount_due, 0) ?? 0
  const collectedRevenue   = payments?.reduce((s, p) => s + p.amount_paid, 0) ?? 0
  const pendingRevenue     = expectedRevenue - collectedRevenue
  const paidMembers        = payments?.filter(p => p.payment_status === 'paid').length ?? 0
  const partialMembers     = payments?.filter(p => p.payment_status === 'partially_paid').length ?? 0
  const pendingMembers     = payments?.filter(p => p.payment_status === 'pending').length ?? 0
  const overdueMembers     = payments?.filter(p => p.payment_status === 'overdue').length ?? 0

  type ExpenseRow = { amount: number; category: { slug: string } | null }
  const expenses = (expensesRaw as unknown as ExpenseRow[]) ?? []

  const totalExpenses      = expenses.reduce((s, e) => s + e.amount, 0)
  const salaryExpenses     = expenses.filter(e => e.category?.slug === 'salaries').reduce((s, e) => s + e.amount, 0)
  const groceryExpenses    = expenses.filter(e => e.category?.slug === 'grocery').reduce((s, e) => s + e.amount, 0)
  const electricityExp     = expenses.filter(e => e.category?.slug === 'electricity').reduce((s, e) => s + e.amount, 0)
  const generatorExp       = expenses.filter(e => ['generator_fuel','generator_maintenance'].includes(e.category?.slug ?? '')).reduce((s, e) => s + e.amount, 0)

  const { getWorkspaceOccupancyStats } = await import('@/lib/queries/spaces')
  const shiftStats = await getWorkspaceOccupancyStats()

  return {
    total_rooms:           totalRooms,
    total_seats:           shiftStats.total_shared_seats,
    occupied_rooms:        oRooms,
    occupied_seats:        shiftStats.dedicated_occupied + shiftStats.morning_occupied + shiftStats.evening_occupied,
    available_rooms:       totalRooms - oRooms,
    available_seats:       totalSeats - oSeats,
    occupancy_percentage:  totalSpaces > 0 ? Math.round((occupiedSpaces / totalSpaces) * 100) : 0,
    morning_occupied:      shiftStats.morning_occupied,
    morning_available:     shiftStats.morning_available,
    evening_occupied:      shiftStats.evening_occupied,
    evening_available:     shiftStats.evening_available,
    dedicated_occupied:    shiftStats.dedicated_occupied,
    total_shift_slots:     shiftStats.total_shift_slots,
    available_shift_slots: shiftStats.available_shift_slots,
    total_active_members:  activeMembers,
    expected_revenue:      expectedRevenue,
    collected_revenue:     collectedRevenue,
    pending_revenue:       pendingRevenue,
    paid_members:          paidMembers,
    partially_paid_members: partialMembers,
    pending_members:       pendingMembers,
    overdue_members:       overdueMembers,
    total_expenses:        totalExpenses,
    salary_expenses:       salaryExpenses,
    grocery_expenses:      groceryExpenses,
    electricity_expenses:  electricityExp,
    generator_expenses:    generatorExp,
    net_profit:            collectedRevenue - totalExpenses,
  }
}

/** Monthly P&L data for the last N months — used for trend charts */
export async function getMonthlyPLData(months = 6): Promise<MonthlyPLData[]> {
  const supabase = await createClient()
  const billingMonths = getLastNMonths(months).reverse()

  const results: MonthlyPLData[] = []

  for (const bm of billingMonths) {
    const { start: monthStart, end: monthEnd } = getMonthDateRange(bm)

    const [{ data: payments }, { data: expenses }] = await Promise.all([
      supabase.from('member_payments').select('amount_due, amount_paid').eq('billing_month', bm),
      supabase.from('expenses').select('amount').gte('expense_date', monthStart).lte('expense_date', monthEnd),
    ])

    const expected  = payments?.reduce((s, p) => s + p.amount_due, 0) ?? 0
    const collected = payments?.reduce((s, p) => s + p.amount_paid, 0) ?? 0
    const totalExp  = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0

    results.push({
      month:            formatMonthShort(bm),
      billing_month:    bm,
      expected_revenue: expected,
      collected_revenue: collected,
      total_expenses:   totalExp,
      net_profit:       collected - totalExp,
    })
  }

  return results
}

/** Expense breakdown by category for a month — used for pie chart */
export async function getExpenseBreakdown(billingMonth: string): Promise<ExpenseBreakdownItem[]> {
  const supabase = await createClient()
  const { start: monthStart, end: monthEnd } = getMonthDateRange(billingMonth)

  const { data } = await supabase
    .from('expenses')
    .select('amount, category:expense_categories(name, slug, color)')
    .gte('expense_date', monthStart)
    .lte('expense_date', monthEnd)

  type Row = { amount: number; category: { name: string; slug: string; color: string } | null }
  const rows = (data as unknown as Row[]) ?? []

  const byCategory: Record<string, { name: string; slug: string; color: string; total: number }> = {}

  for (const row of rows) {
    const key = row.category?.slug ?? 'miscellaneous'
    if (!byCategory[key]) {
      byCategory[key] = { name: row.category?.name ?? 'Other', slug: key, color: row.category?.color ?? '#94a3b8', total: 0 }
    }
    byCategory[key].total += row.amount
  }

  const grandTotal = Object.values(byCategory).reduce((s, c) => s + c.total, 0)

  return Object.values(byCategory)
    .sort((a, b) => b.total - a.total)
    .map(c => ({
      category:   c.name,
      slug:       c.slug,
      color:      c.color,
      amount:     c.total,
      percentage: grandTotal > 0 ? Math.round((c.total / grandTotal) * 100) : 0,
    }))
}

/** Payment alert data — members who haven't paid for current month */
export async function getPaymentAlertData(billingMonth: string): Promise<{
  id: string
  amount_due: number
  amount_paid: number
  payment_status: string
  due_date: string
  member: { id: string; full_name: string; phone: string | null } | null
}[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('member_payments')
    .select(`
      id,
      amount_due,
      amount_paid,
      payment_status,
      due_date,
      member:members(id, full_name, phone)
    `)
    .eq('billing_month', billingMonth)
    .in('payment_status', ['pending', 'partially_paid', 'overdue'])
    .order('payment_status', { ascending: true })

  // Supabase returns FK relations as arrays; normalise to single object
  return (data ?? []).map((row: any) => ({
    ...row,
    member: Array.isArray(row.member) ? (row.member[0] ?? null) : (row.member ?? null),
  }))
}

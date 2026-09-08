import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency, formatMonth, currentBillingMonth, getLastNMonths, getMonthDateRange, PAYMENT_STATUS_LABELS } from '@/lib/utils/formatters'
import MonthSwitcher from '@/components/dashboard/MonthSwitcher'
import { FileBarChart } from 'lucide-react'

export const metadata: Metadata = { title: 'Reports' }

const STATUS_BADGE: Record<string, string> = {
  pending:        'bg-amber-100 text-amber-800 border-amber-200',
  partially_paid: 'bg-blue-100 text-blue-700 border-blue-200',
  paid:           'bg-green-100 text-green-700 border-green-200',
  overdue:        'bg-red-100 text-red-700 border-red-200',
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; report?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const billingMonth = params.month ?? currentBillingMonth()
  const report = params.report ?? 'pl'
  const symbol = 'Rs.'

  // Fetch P&L data for last 12 months
  const plMonths = getLastNMonths(12).reverse()
  const plRows = await Promise.all(plMonths.map(async bm => {
    const { start: mStart, end: mEnd } = getMonthDateRange(bm)
    const [{ data: pays }, { data: exps }] = await Promise.all([
      supabase.from('member_payments').select('amount_due, amount_paid').eq('billing_month', bm),
      supabase.from('expenses').select('amount').gte('expense_date', mStart).lte('expense_date', mEnd),
    ])
    const collected = pays?.reduce((s, p) => s + p.amount_paid, 0) ?? 0
    const expected  = pays?.reduce((s, p) => s + p.amount_due, 0) ?? 0
    const expenses  = exps?.reduce((s, e) => s + e.amount, 0) ?? 0
    return { billingMonth: bm, month: formatMonth(bm), expected, collected, expenses, profit: collected - expenses }
  }))

  const { data: pendingPayments } = await supabase
    .from('member_payments')
    .select(`*, member:members(full_name, phone)`)
    .eq('billing_month', billingMonth)
    .in('payment_status', ['pending', 'partially_paid', 'overdue'])
    .order('payment_status')

  const REPORTS = [
    { id: 'pl',       label: 'Profit & Loss' },
    { id: 'pending',  label: 'Pending Payments' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Financial reports and summaries</p>
        </div>
        <MonthSwitcher selectedMonth={billingMonth} />
      </div>

      {/* Report selector */}
      <div className="flex gap-2 flex-wrap">
        {REPORTS.map(r => (
          <a key={r.id} href={`?report=${r.id}&month=${billingMonth}`}>
            <Badge
              variant={report === r.id ? 'default' : 'outline'}
              className={`cursor-pointer text-xs px-3 py-1.5 ${report === r.id ? 'bg-indigo-600 hover:bg-indigo-500' : 'hover:bg-muted'}`}
            >
              {r.label}
            </Badge>
          </a>
        ))}
      </div>

      {/* P&L Report */}
      {report === 'pl' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Profit & Loss — Last 12 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Expected Revenue</TableHead>
                  <TableHead className="text-right">Collected</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Net Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plRows.map(row => (
                  <TableRow key={row.billingMonth}>
                    <TableCell className="font-medium text-sm">{row.month}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(row.expected, symbol)}</TableCell>
                    <TableCell className="text-right text-sm text-green-600">{formatCurrency(row.collected, symbol)}</TableCell>
                    <TableCell className="text-right text-sm text-red-600">{formatCurrency(row.expenses, symbol)}</TableCell>
                    <TableCell className={`text-right text-sm font-bold ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {row.profit >= 0 ? '+' : ''}{formatCurrency(row.profit, symbol)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pending Payments Report */}
      {report === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending Payments — {formatMonth(billingMonth)}</CardTitle>
          </CardHeader>
          <CardContent>
            {(pendingPayments ?? []).length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">All members have paid! 🎉</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead className="text-right">Amount Due</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(pendingPayments ?? []).map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{p.member?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{p.member?.phone}</p>
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(p.amount_due, symbol)}</TableCell>
                      <TableCell className="text-right text-sm text-green-600">{formatCurrency(p.amount_paid, symbol)}</TableCell>
                      <TableCell className="text-right text-sm font-bold text-red-600">{formatCurrency(p.amount_due - p.amount_paid, symbol)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${STATUS_BADGE[p.payment_status] ?? ''}`}>
                          {PAYMENT_STATUS_LABELS[p.payment_status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

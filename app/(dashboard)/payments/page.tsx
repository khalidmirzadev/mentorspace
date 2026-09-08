import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { formatDate, formatCurrency, formatMonth, currentBillingMonth, PAYMENT_STATUS_LABELS, toBillingMonth } from '@/lib/utils/formatters'
import { generateMonthlyPayments } from '@/lib/utils/payment-generator'
import MonthSwitcher from '@/components/dashboard/MonthSwitcher'
import { RefreshCw, ChevronRight, Zap } from 'lucide-react'
import GeneratePaymentsButton from '@/components/payments/GeneratePaymentsButton'

export const metadata: Metadata = { title: 'Payments' }

const STATUS_BADGE: Record<string, string> = {
  pending:        'bg-amber-100 text-amber-800 border-amber-200',
  partially_paid: 'bg-blue-100 text-blue-700 border-blue-200',
  paid:           'bg-green-100 text-green-700 border-green-200',
  overdue:        'bg-red-100 text-red-700 border-red-200',
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; status?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const billingMonth = params.month ?? currentBillingMonth()
  const statusFilter = params.status

  let query = supabase
    .from('member_payments')
    .select(`*, member:members(id, full_name, phone, status)`)
    .eq('billing_month', billingMonth)
    .order('payment_status', { ascending: true })
    .order('created_at', { ascending: true })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('payment_status', statusFilter)
  }

  const { data: payments } = await query

  // Summary stats
  const all = payments ?? []
  const totalDue   = all.reduce((s, p) => s + p.amount_due, 0)
  const totalPaid  = all.reduce((s, p) => s + p.amount_paid, 0)
  const symbol     = 'Rs.'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Monthly member payment collection</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSwitcher selectedMonth={billingMonth} />
          <GeneratePaymentsButton billingMonth={billingMonth} />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Expected',   value: formatCurrency(totalDue,              symbol),  color: '' },
          { label: 'Collected',  value: formatCurrency(totalPaid,             symbol),  color: 'text-green-600' },
          { label: 'Remaining',  value: formatCurrency(totalDue - totalPaid,  symbol),  color: 'text-amber-600' },
          { label: 'Members',    value: `${all.filter(p => p.payment_status === 'paid').length}/${all.length} paid`, color: '' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          {all.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm mb-3">No payment records for {formatMonth(billingMonth)}</p>
              <GeneratePaymentsButton billingMonth={billingMonth} />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.map((payment: any) => {
                  const remaining = payment.amount_due - payment.amount_paid
                  return (
                    <TableRow key={payment.id} className="group">
                      <TableCell>
                        <p className="font-medium text-sm">{payment.member?.full_name}</p>
                        {payment.member?.phone && <p className="text-xs text-muted-foreground">{payment.member.phone}</p>}
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">{formatCurrency(payment.amount_due, symbol)}</TableCell>
                      <TableCell className="text-right text-sm text-green-600">{formatCurrency(payment.amount_paid, symbol)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        <span className={remaining > 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(remaining, symbol)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${STATUS_BADGE[payment.payment_status] ?? ''}`}>
                          {PAYMENT_STATUS_LABELS[payment.payment_status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.payment_date ? formatDate(payment.payment_date) : '—'}
                      </TableCell>
                      <TableCell>
                        <Link href={`/payments/${payment.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPaymentWithTransactions } from '@/lib/queries/members'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import PageHeader from '@/components/shared/PageHeader'
import RecordPaymentButton from '@/components/payments/RecordPaymentButton'
import {
  formatDate, formatCurrency, formatMonth, PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS,
} from '@/lib/utils/formatters'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = { title: 'Payment Detail' }

const STATUS_COLORS: Record<string, string> = {
  pending:        'bg-amber-100 text-amber-800 border-amber-200',
  partially_paid: 'bg-blue-100 text-blue-700 border-blue-200',
  paid:           'bg-green-100 text-green-700 border-green-200',
  overdue:        'bg-red-100 text-red-700 border-red-200',
}
const STATUS_ICONS: Record<string, React.ElementType> = {
  paid:           CheckCircle,
  partially_paid: Clock,
  overdue:        AlertTriangle,
  pending:        Clock,
}

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payment = await getPaymentWithTransactions(id)

  if (!payment) notFound()

  const symbol    = 'Rs.'
  const progress  = payment.amount_due > 0
    ? Math.min(100, Math.round((payment.amount_paid / payment.amount_due) * 100))
    : 0
  const isPaid    = payment.payment_status === 'paid'
  const StatusIcon = STATUS_ICONS[payment.payment_status] ?? Clock

  return (
    <div>
      <PageHeader
        title={`${payment.member?.full_name ?? 'Member'} — ${formatMonth(payment.billing_month)}`}
        description={`Payment record for ${formatMonth(payment.billing_month)}`}
        backHref={payment.member ? `/members/${payment.member.id}` : '/payments'}
        backLabel={payment.member?.full_name ?? 'Payments'}
        actions={
          <RecordPaymentButton
            paymentId={payment.id}
            amountDue={payment.amount_due}
            amountPaid={payment.amount_paid}
            remaining={payment.remaining}
            isPaid={isPaid}
          />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Summary */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              {/* Status badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline" className={`${STATUS_COLORS[payment.payment_status] ?? ''} flex items-center gap-1.5`}>
                  <StatusIcon className="w-3 h-3" />
                  {PAYMENT_STATUS_LABELS[payment.payment_status]}
                </Badge>
              </div>

              <Separator />

              {/* Amounts */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Due</span>
                  <span className="font-semibold">{formatCurrency(payment.amount_due, symbol)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="font-semibold text-green-600">{formatCurrency(payment.amount_paid, symbol)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className={`font-bold ${payment.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(payment.remaining, symbol)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Collection progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <Separator />

              {/* Dates */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing Month</span>
                  <span>{formatMonth(payment.billing_month)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span>{formatDate(payment.due_date)}</span>
                </div>
                {payment.payment_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Payment</span>
                    <span>{formatDate(payment.payment_date)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Member info */}
          {payment.member && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Member</p>
                <Link href={`/members/${payment.member.id}`} className="font-semibold text-indigo-600 hover:underline">
                  {payment.member.full_name}
                </Link>
                {payment.member.phone && (
                  <p className="text-sm text-muted-foreground mt-1">{payment.member.phone}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Monthly: {formatCurrency(payment.member.monthly_amount, symbol)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Transaction History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Payment Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {payment.transactions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No transactions yet. Use "Record Payment" to log a payment.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payment.transactions.map(tx => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm">{formatDate(tx.paid_on)}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600 text-sm">
                          {formatCurrency(tx.amount, symbol)}
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          {tx.payment_method ? PAYMENT_METHOD_LABELS[tx.payment_method] : 'Cash'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{tx.notes ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

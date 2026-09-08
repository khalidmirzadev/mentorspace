'use client'

import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardKPIs } from '@/types'
import { formatCurrency, formatMonth, isPaymentAlertPeriod, PAYMENT_STATUS_LABELS } from '@/lib/utils/formatters'
import { AlertTriangle, ChevronRight, Clock } from 'lucide-react'

interface PaymentAlertBannerProps {
  billingMonth: string
  kpis: DashboardKPIs
  alertData: {
    id: string
    amount_due: number
    amount_paid: number
    payment_status: string
    due_date: string
    member: { id: string; full_name: string; phone: string | null } | null
  }[]
}

const STATUS_COLORS: Record<string, string> = {
  pending:        'bg-amber-100 text-amber-800 border-amber-200',
  partially_paid: 'bg-blue-100 text-blue-800 border-blue-200',
  overdue:        'bg-red-100 text-red-800 border-red-200',
}

export default function PaymentAlertBanner({ billingMonth, kpis, alertData }: PaymentAlertBannerProps) {
  const symbol = 'Rs.'
  // Show banner if there are any unpaid members this month
  const hasPending = alertData.length > 0

  if (!hasPending) {
    return (
      <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
        <AlertDescription className="text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
          <span>✓</span>
          All members have paid for {formatMonth(billingMonth)}!
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-400 text-base">
            <AlertTriangle className="w-4 h-4" />
            Payment Collection — {formatMonth(billingMonth)}
          </CardTitle>
          <Link href={`/payments?month=${billingMonth}&status=pending`}>
            <Button variant="outline" size="sm" className="text-xs border-amber-300 hover:bg-amber-100">
              View all <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Expected',        value: formatCurrency(kpis.expected_revenue, symbol, true), color: 'text-foreground' },
            { label: 'Collected',       value: formatCurrency(kpis.collected_revenue, symbol, true), color: 'text-green-700 dark:text-green-400' },
            { label: 'Pending',         value: formatCurrency(kpis.pending_revenue, symbol, true),   color: 'text-amber-700 dark:text-amber-400' },
            { label: `${kpis.overdue_members} Overdue`, value: `${kpis.paid_members} Paid / ${kpis.pending_members} Pending`, color: kpis.overdue_members > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/70 dark:bg-slate-900/40 rounded-lg p-3 border border-amber-100 dark:border-amber-900/40">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              <p className={`text-sm font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Unpaid members list (max 5) */}
        <div className="space-y-1.5">
          {alertData.slice(0, 5).map(payment => {
            const remaining = payment.amount_due - payment.amount_paid
            return (
              <div key={payment.id} className="flex items-center justify-between bg-white/70 dark:bg-slate-900/40 rounded-lg px-3 py-2 border border-amber-100 dark:border-amber-900/40 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-amber-200 dark:bg-amber-900 flex items-center justify-center text-[10px] font-bold text-amber-800 dark:text-amber-300 shrink-0">
                    {payment.member?.full_name.slice(0, 2).toUpperCase() ?? '??'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{payment.member?.full_name}</p>
                    {payment.member?.phone && (
                      <p className="text-xs text-muted-foreground">{payment.member.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[payment.payment_status] ?? ''}`}>
                    {PAYMENT_STATUS_LABELS[payment.payment_status]}
                  </span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(remaining, symbol)}
                  </span>
                  <Link href={`/payments/${payment.id}`}>
                    <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white">
                      Pay
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
          {alertData.length > 5 && (
            <p className="text-xs text-center text-muted-foreground pt-1">
              +{alertData.length - 5} more members — <Link href="/payments" className="text-indigo-600 hover:underline">View all</Link>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

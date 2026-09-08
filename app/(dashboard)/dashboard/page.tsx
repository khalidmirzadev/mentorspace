import type { Metadata } from 'next'
import { Suspense } from 'react'
import { currentBillingMonth } from '@/lib/utils/formatters'
import { getDashboardKPIs, getMonthlyPLData, getExpenseBreakdown, getPaymentAlertData } from '@/lib/queries/dashboard'
import KpiCards from '@/components/dashboard/KpiCards'
import PaymentAlertBanner from '@/components/dashboard/PaymentAlertBanner'
import MonthlyTrendChart from '@/components/dashboard/MonthlyTrendChart'
import ExpenseBreakdownChart from '@/components/dashboard/ExpenseBreakdownChart'
import MonthSwitcher from '@/components/dashboard/MonthSwitcher'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const params = await searchParams
  const billingMonth = params.month ?? currentBillingMonth()

  const [kpis, plData, expenseBreakdown, alertData] = await Promise.all([
    getDashboardKPIs(billingMonth),
    getMonthlyPLData(6),
    getExpenseBreakdown(billingMonth),
    getPaymentAlertData(billingMonth),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            MentorSpace overview & financial summary
          </p>
        </div>
        <MonthSwitcher selectedMonth={billingMonth} />
      </div>

      {/* Payment Alert Banner (prominent 1st–5th of month) */}
      <PaymentAlertBanner
        billingMonth={billingMonth}
        alertData={alertData}
        kpis={kpis}
      />

      {/* KPI Cards */}
      <KpiCards kpis={kpis} billingMonth={billingMonth} />

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <MonthlyTrendChart data={plData} />
        </div>
        <div>
          <ExpenseBreakdownChart data={expenseBreakdown} />
        </div>
      </div>
    </div>
  )
}

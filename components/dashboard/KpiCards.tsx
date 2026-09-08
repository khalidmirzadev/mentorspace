import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { DashboardKPIs } from '@/types'
import { formatCurrency, formatMonth, percentage } from '@/lib/utils/formatters'
import {
  Users, MapPin, TrendingUp, TrendingDown, CreditCard,
  DollarSign, AlertTriangle, CheckCircle, BarChart3, Building,
} from 'lucide-react'
import Link from 'next/link'

interface KpiCardsProps {
  kpis: DashboardKPIs
  billingMonth: string
}

interface KpiCardProps {
  title: string
  value: string
  sub?: string
  icon: React.ReactNode
  badge?: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
  href?: string
  trend?: 'up' | 'down' | 'neutral'
  highlight?: 'primary' | 'success' | 'warning' | 'danger'
}

function KpiCard({ title, value, sub, icon, badge, href, highlight }: KpiCardProps) {
  const HIGHLIGHT_CLASS: Record<string, string> = {
    primary: 'ring-1 ring-indigo-500/20 bg-indigo-50 dark:bg-indigo-950/20',
    success:  'ring-1 ring-green-500/20 bg-green-50 dark:bg-green-950/20',
    warning:  'ring-1 ring-amber-500/20 bg-amber-50 dark:bg-amber-950/20',
    danger:   'ring-1 ring-red-500/20 bg-red-50 dark:bg-red-950/20',
  }
  const ICON_CLASS: Record<string, string> = {
    primary: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
    success:  'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
    warning:  'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
    danger:   'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  }
  const highlightClass = (highlight ? HIGHLIGHT_CLASS[highlight] : undefined) ?? ''
  const iconClass = (highlight ? ICON_CLASS[highlight] : undefined) ?? 'bg-muted text-muted-foreground'

  const card = (
    <Card className={`transition-all hover:shadow-md ${highlightClass} ${href ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            {badge && (
              <Badge variant={badge.variant} className="mt-2 text-[10px]">{badge.label}</Badge>
            )}
          </div>
          <div className={`rounded-xl p-2.5 ml-3 shrink-0 ${iconClass}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return href ? <Link href={href}>{card}</Link> : card
}

export default function KpiCards({ kpis, billingMonth }: KpiCardsProps) {
  const symbol = 'Rs.'

  return (
    <div className="space-y-4">
      {/* Row 1: Space & Members */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Members"
          value={String(kpis.total_active_members)}
          icon={<Users className="w-5 h-5" />}
          highlight="primary"
          href="/members"
        />
        <KpiCard
          title="19 Shared Desks"
          value={`${kpis.dedicated_occupied + kpis.morning_occupied + kpis.evening_occupied} active`}
          sub={`☀️ ${kpis.morning_occupied} morning · 🌙 ${kpis.evening_occupied} evening · ⚡ ${kpis.dedicated_occupied} dedicated`}
          icon={<Building className="w-5 h-5" />}
          highlight="primary"
          href="/spaces"
        />
        <KpiCard
          title="Shift Slots Capacity"
          value={`${kpis.available_shift_slots ?? (38 - (kpis.occupied_seats || 0))} Available`}
          sub={`out of ${kpis.total_shift_slots ?? 38} bookable shift slots`}
          icon={<MapPin className="w-5 h-5" />}
          highlight={(kpis.available_shift_slots ?? 0) > 10 ? 'success' : 'warning'}
          href="/spaces"
        />
        <KpiCard
          title="Monthly Revenue"
          value={formatCurrency(kpis.expected_revenue, symbol, true)}
          sub="Expected this month"
          icon={<DollarSign className="w-5 h-5" />}
          highlight="primary"
        />
      </div>

      {/* Row 2: Payment collection */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Collected"
          value={formatCurrency(kpis.collected_revenue, symbol, true)}
          sub={`${kpis.paid_members} members paid`}
          icon={<CheckCircle className="w-5 h-5" />}
          highlight="success"
          href="/payments"
        />
        <KpiCard
          title="Pending"
          value={formatCurrency(kpis.pending_revenue, symbol, true)}
          sub={`${kpis.pending_members + kpis.overdue_members} not paid`}
          icon={<CreditCard className="w-5 h-5" />}
          highlight={kpis.pending_revenue > 0 ? 'warning' : 'success'}
          href="/payments?status=pending"
        />
        <KpiCard
          title="Overdue"
          value={String(kpis.overdue_members)}
          sub="members overdue"
          icon={<AlertTriangle className="w-5 h-5" />}
          highlight={kpis.overdue_members > 0 ? 'danger' : 'success'}
          href="/payments?status=overdue"
        />
        <KpiCard
          title="Total Expenses"
          value={formatCurrency(kpis.total_expenses, symbol, true)}
          sub="this month"
          icon={<BarChart3 className="w-5 h-5" />}
          highlight="warning"
          href="/expenses"
        />
      </div>

      {/* Row 3: P&L + Expense breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Net Profit"
          value={formatCurrency(Math.abs(kpis.net_profit), symbol, true)}
          sub={kpis.net_profit >= 0 ? 'Profit' : 'Loss'}
          icon={kpis.net_profit >= 0
            ? <TrendingUp className="w-5 h-5" />
            : <TrendingDown className="w-5 h-5" />}
          highlight={kpis.net_profit >= 0 ? 'success' : 'danger'}
        />
        <KpiCard
          title="Salaries"
          value={formatCurrency(kpis.salary_expenses, symbol, true)}
          icon={<Users className="w-4 h-4" />}
          href="/staff"
        />
        <KpiCard
          title="Grocery"
          value={formatCurrency(kpis.grocery_expenses, symbol, true)}
          icon={<BarChart3 className="w-4 h-4" />}
          href="/grocery"
        />
        <KpiCard
          title="Electricity"
          value={formatCurrency(kpis.electricity_expenses, symbol, true)}
          icon={<BarChart3 className="w-4 h-4" />}
          href="/expenses?category=electricity"
        />
        <KpiCard
          title="Generator"
          value={formatCurrency(kpis.generator_expenses, symbol, true)}
          icon={<BarChart3 className="w-4 h-4" />}
          href="/generator"
        />
      </div>
    </div>
  )
}

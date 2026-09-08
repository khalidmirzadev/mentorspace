import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatCurrency, formatMonth, currentBillingMonth, getMonthDateRange, GENERATOR_TYPE_LABELS } from '@/lib/utils/formatters'
import { Plus, Zap } from 'lucide-react'
import MonthSwitcher from '@/components/dashboard/MonthSwitcher'

export const metadata: Metadata = { title: 'Generator' }

const TYPE_COLORS: Record<string, string> = {
  fuel:        'bg-orange-100 text-orange-700 border-orange-200',
  maintenance: 'bg-blue-100 text-blue-700 border-blue-200',
  repair:      'bg-red-100 text-red-700 border-red-200',
  other:       'bg-slate-100 text-slate-600 border-slate-200',
}

export default async function GeneratorPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const billingMonth = params.month ?? currentBillingMonth()
  const { start: monthStart, end: monthEnd } = getMonthDateRange(billingMonth)

  const { data: entries } = await supabase
    .from('generator_expenses')
    .select('*')
    .gte('expense_date', monthStart)
    .lte('expense_date', monthEnd)
    .order('expense_date', { ascending: false })

  const total        = entries?.reduce((s, e) => s + e.total_amount, 0) ?? 0
  const fuelTotal    = entries?.filter(e => e.type === 'fuel').reduce((s, e) => s + e.total_amount, 0) ?? 0
  const maintTotal   = entries?.filter(e => e.type !== 'fuel').reduce((s, e) => s + e.total_amount, 0) ?? 0
  const totalLiters  = entries?.filter(e => e.fuel_liters).reduce((s, e) => s + (e.fuel_liters ?? 0), 0) ?? 0
  const symbol = 'Rs.'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Generator</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Fuel and maintenance expense tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSwitcher selectedMonth={billingMonth} />
          <Link href="/generator/new">
            <Button className="bg-indigo-600 hover:bg-indigo-500">
              <Plus className="w-4 h-4 mr-2" /> Add Entry
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Cost', value: formatCurrency(total, symbol, true), color: 'text-foreground' },
          { label: 'Fuel Cost', value: formatCurrency(fuelTotal, symbol, true), color: 'text-orange-600' },
          { label: 'Maintenance', value: formatCurrency(maintTotal, symbol, true), color: 'text-blue-600' },
          { label: 'Fuel Purchased', value: totalLiters > 0 ? `${totalLiters.toFixed(1)} L` : '—', color: 'text-slate-600' },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-4"><p className={`text-xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground mt-0.5">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4">
          {(entries ?? []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No generator entries for {formatMonth(billingMonth)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Fuel (L)</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(entries ?? []).map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm">{formatDate(entry.expense_date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${TYPE_COLORS[entry.type] ?? ''}`}>
                        {GENERATOR_TYPE_LABELS[entry.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{entry.description ?? '—'}</TableCell>
                    <TableCell className="text-sm">{entry.fuel_liters ? `${entry.fuel_liters} L` : '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{entry.vendor ?? '—'}</TableCell>
                    <TableCell className="text-right font-medium text-sm">{formatCurrency(entry.total_amount, symbol)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

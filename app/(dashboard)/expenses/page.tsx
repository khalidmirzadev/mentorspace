import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatCurrency, currentBillingMonth } from '@/lib/utils/formatters'
import { Plus, ChevronRight } from 'lucide-react'
import MonthSwitcher from '@/components/dashboard/MonthSwitcher'

export const metadata: Metadata = { title: 'Expenses' }

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; category?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const billingMonth = params.month ?? currentBillingMonth()
  const [year, mon] = billingMonth.split('-').map(Number)
  const monthStart = `${year}-${String(mon).padStart(2, '0')}-01`
  const monthEnd   = new Date(year, mon, 0).toISOString().split('T')[0]

  const { data: categories } = await supabase.from('expense_categories').select('*').order('sort_order')

  let query = supabase
    .from('expenses')
    .select(`*, category:expense_categories(name, color, slug)`)
    .gte('expense_date', monthStart)
    .lte('expense_date', monthEnd)
    .order('expense_date', { ascending: false })

  if (params.category) query = query.eq('expense_categories.slug', params.category)

  const { data: expenses } = await query
  const total = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0
  const symbol = 'Rs.'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground text-sm mt-0.5">All operational expenses</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSwitcher selectedMonth={billingMonth} />
          <Link href="/expenses/new">
            <Button className="bg-indigo-600 hover:bg-indigo-500">
              <Plus className="w-4 h-4 mr-2" /> Add Expense
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-xl font-bold">{formatCurrency(total, symbol, true)}</p><p className="text-xs text-muted-foreground">Total This Month</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{expenses?.length ?? 0}</p><p className="text-xs text-muted-foreground">Transactions</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xl font-bold">{categories?.length ?? 0}</p><p className="text-xs text-muted-foreground">Categories</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          {(expenses ?? []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No expenses recorded this month</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(expenses ?? []).map((expense: any) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-sm">{formatDate(expense.expense_date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: expense.category?.color ?? '#94a3b8' }} />
                        <span className="text-sm">{expense.category?.name ?? '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{expense.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{expense.vendor ?? '—'}</TableCell>
                    <TableCell className="text-right font-medium text-sm">{formatCurrency(expense.amount, symbol)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{expense.payment_method ?? 'Cash'}</Badge>
                    </TableCell>
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

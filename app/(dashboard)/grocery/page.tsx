import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatCurrency, formatMonth, currentBillingMonth, getMonthDateRange } from '@/lib/utils/formatters'
import { Plus, ShoppingCart, ChevronRight } from 'lucide-react'
import MonthSwitcher from '@/components/dashboard/MonthSwitcher'

export const metadata: Metadata = { title: 'Grocery' }

export default async function GroceryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const billingMonth = params.month ?? currentBillingMonth()
  const { start: monthStart, end: monthEnd } = getMonthDateRange(billingMonth)

  const { data: sessions } = await supabase
    .from('grocery_sessions')
    .select(`*, items:grocery_items(*)`)
    .gte('session_date', monthStart)
    .lte('session_date', monthEnd)
    .order('session_date', { ascending: false })

  const monthTotal = sessions?.reduce((s, g) => s + g.total_amount, 0) ?? 0
  const symbol = 'Rs.'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Grocery</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Monthly grocery purchases and item tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSwitcher selectedMonth={billingMonth} />
          <Link href="/grocery/new">
            <Button className="bg-indigo-600 hover:bg-indigo-500">
              <Plus className="w-4 h-4 mr-2" /> Add Session
            </Button>
          </Link>
        </div>
      </div>

      {/* Monthly total card */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="ring-1 ring-green-200 bg-green-50/40 dark:ring-green-900/40 dark:bg-green-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-xl font-bold">{formatCurrency(monthTotal, symbol, true)}</p>
              <p className="text-xs text-muted-foreground">Total for {formatMonth(billingMonth)}</p>
            </div>
          </CardContent>
        </Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{sessions?.length ?? 0}</p><p className="text-xs text-muted-foreground">Shopping Trips</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xl font-bold">{formatCurrency(sessions?.length ? monthTotal / sessions.length : 0, symbol, true)}</p><p className="text-xs text-muted-foreground">Avg per Trip</p></CardContent></Card>
      </div>

      {/* Sessions */}
      <div className="space-y-4">
        {(sessions ?? []).length === 0 ? (
          <Card><CardContent className="text-center py-12 text-muted-foreground text-sm">No grocery sessions this month</CardContent></Card>
        ) : (
          (sessions ?? []).map((session: any) => (
            <Card key={session.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">{formatDate(session.session_date)}</CardTitle>
                    {session.vendor && <p className="text-xs text-muted-foreground">{session.vendor}</p>}
                  </div>
                  <span className="font-bold text-base">{formatCurrency(session.total_amount, symbol)}</span>
                </div>
              </CardHeader>
              {session.items && session.items.length > 0 && (
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Item</TableHead>
                        <TableHead className="text-xs">Qty</TableHead>
                        <TableHead className="text-xs text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {session.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm">{item.item_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.quantity ?? '—'}</TableCell>
                          <TableCell className="text-sm text-right">{formatCurrency(item.total_price, symbol)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

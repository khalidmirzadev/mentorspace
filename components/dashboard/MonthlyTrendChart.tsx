'use client'

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MonthlyPLData } from '@/types'
import { formatCurrency } from '@/lib/utils/formatters'

interface MonthlyTrendChartProps {
  data: MonthlyPLData[]
}

const symbol = 'Rs.'

function formatK(value: number) {
  if (value >= 1000) return `${symbol}${(value / 1000).toFixed(0)}K`
  return `${symbol}${value}`
}

export default function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-semibold text-foreground">
          Revenue vs Expenses (Last 6 Months)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatK}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value, name) => [
                formatCurrency(Number(value ?? 0), symbol),
                name === 'collected_revenue' ? 'Collected'
                  : name === 'total_expenses' ? 'Expenses'
                  : 'Net Profit',
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}
              formatter={(value) =>
                value === 'collected_revenue' ? 'Collected'
                : value === 'total_expenses' ? 'Expenses'
                : 'Net Profit'
              }
            />
            <Bar dataKey="collected_revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="total_expenses" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Line
              type="monotone"
              dataKey="net_profit"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-2))', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { formatMonth, toBillingMonth } from '@/lib/utils/formatters'

interface MonthSwitcherProps {
  selectedMonth: string // '2025-01-01'
}

export default function MonthSwitcher({ selectedMonth }: MonthSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function navigate(billingMonth: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', billingMonth)
    router.push(`${pathname}?${params.toString()}`)
  }

  function changeMonth(delta: number) {
    const d = new Date(selectedMonth)
    d.setMonth(d.getMonth() + delta)
    navigate(toBillingMonth(d.getFullYear(), d.getMonth() + 1))
  }

  const isCurrentMonth = selectedMonth === toBillingMonth(
    new Date().getFullYear(),
    new Date().getMonth() + 1
  )

  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 rounded-md"
        onClick={() => changeMonth(-1)}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-1.5 px-2 min-w-[130px] justify-center">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-sm font-medium">{formatMonth(selectedMonth)}</span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 rounded-md"
        onClick={() => changeMonth(1)}
        disabled={isCurrentMonth}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      {!isCurrentMonth && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground rounded-md"
          onClick={() => navigate(toBillingMonth(new Date().getFullYear(), new Date().getMonth() + 1))}
        >
          Today
        </Button>
      )}
    </div>
  )
}

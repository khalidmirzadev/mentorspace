'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { paySalaryAction } from '@/lib/actions/staff'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import type { StaffAdvance } from '@/types'
import { AlertCircle, Loader2, DollarSign } from 'lucide-react'

interface PaySalaryDialogProps {
  staffId: string
  staffName: string
  baseSalary: number
  outstandingAdvances: (StaffAdvance & { remaining: number })[]
  salaryId?: string | null
  initialBillingMonth?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function PaySalaryDialog({
  staffId,
  staffName,
  baseSalary,
  outstandingAdvances,
  salaryId,
  initialBillingMonth,
  open,
  onOpenChange,
}: PaySalaryDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const todayStr = new Date().toISOString().split('T')[0]
  const defaultMonth = initialBillingMonth || todayStr.slice(0, 7) + '-01'

  const [billingMonth, setBillingMonth] = useState(defaultMonth)
  const [paidOn, setPaidOn] = useState(todayStr)
  const [paymentMethod, setPaymentMethod] = useState('cash')

  // Map of advanceId -> deduction amount
  const [deductions, setDeductions] = useState<Record<string, number>>({})

  const totalDeducted = Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0)
  const netPay = Math.max(0, baseSalary - totalDeducted)

  function handleDeductionChange(advId: string, max: number, valueStr: string) {
    const val = Math.min(max, Math.max(0, parseFloat(valueStr) || 0))
    setDeductions(prev => ({
      ...prev,
      [advId]: val,
    }))
  }

  function handleQuickDeductAll(advId: string, remaining: number) {
    setDeductions(prev => ({
      ...prev,
      [advId]: prev[advId] === remaining ? 0 : remaining,
    }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const activeAdvanceIds = Object.keys(deductions).filter(id => (deductions[id] ?? 0) > 0)

    startTransition(async () => {
      const res = await paySalaryAction(
        salaryId,
        staffId,
        netPay,
        totalDeducted,
        paidOn,
        paymentMethod,
        activeAdvanceIds,
        deductions,
        billingMonth,
        baseSalary
      )

      if (res?.error) {
        setError(res.error)
      } else {
        onOpenChange(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Disburse Salary — {staffName}</DialogTitle>
          <DialogDescription>
            Record salary payment, deduct outstanding advances, and create a corresponding expense entry.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="billingMonth">Billing Month</Label>
              <Input
                id="billingMonth"
                type="month"
                value={billingMonth.slice(0, 7)}
                onChange={e => setBillingMonth(e.target.value ? `${e.target.value}-01` : defaultMonth)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paidOn">Disbursement Date *</Label>
              <Input
                id="paidOn"
                type="date"
                value={paidOn}
                onChange={e => setPaidOn(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v ?? 'cash')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="online">Online Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advances Section */}
          {outstandingAdvances.length > 0 && (
            <div className="space-y-2 p-3 bg-muted/60 rounded-lg border border-border/50">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Outstanding Advances ({outstandingAdvances.length})
                </p>
                <p className="text-xs text-muted-foreground">
                  Total Debt: {formatCurrency(outstandingAdvances.reduce((s, a) => s + a.remaining, 0), 'Rs.')}
                </p>
              </div>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {outstandingAdvances.map(adv => {
                  const currentDeduction = deductions[adv.id] ?? 0
                  return (
                    <div key={adv.id} className="p-2 bg-background rounded-md border text-sm flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-xs">
                          {adv.reason ? adv.reason : 'Advance'} · {formatDate(adv.advance_date)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Remaining: <span className="font-semibold text-amber-600">Rs. {adv.remaining.toLocaleString()}</span> (Total: Rs. {adv.amount.toLocaleString()})
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-1.5 text-[11px] text-indigo-600"
                          onClick={() => handleQuickDeductAll(adv.id, adv.remaining)}
                        >
                          {currentDeduction === adv.remaining ? 'Clear' : 'Deduct All'}
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          max={adv.remaining}
                          step="1"
                          className="h-7 w-20 text-xs text-right"
                          placeholder="0"
                          value={currentDeduction || ''}
                          onChange={e => handleDeductionChange(adv.id, adv.remaining, e.target.value)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Calculation Summary */}
          <div className="rounded-lg border bg-card p-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Base Monthly Salary:</span>
              <span>{formatCurrency(baseSalary, 'Rs.')}</span>
            </div>
            {totalDeducted > 0 && (
              <div className="flex justify-between text-amber-600 font-medium">
                <span>Advance Deduction:</span>
                <span>- {formatCurrency(totalDeducted, 'Rs.')}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between items-center pt-1">
              <span className="font-bold text-base">Net Amount to Pay:</span>
              <span className="font-bold text-lg text-green-600">{formatCurrency(netPay, 'Rs.')}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</>
              ) : (
                <><DollarSign className="w-4 h-4 mr-1.5" /> Disburse {formatCurrency(netPay, 'Rs.')}</>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

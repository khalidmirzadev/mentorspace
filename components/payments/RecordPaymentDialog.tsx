'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { recordPaymentAction } from '@/lib/actions/payments'
import type { PaymentMethod } from '@/types'
import { formatCurrency } from '@/lib/utils/formatters'
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react'

interface RecordPaymentDialogProps {
  paymentId: string
  amountDue: number
  amountPaid: number
  remaining: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function RecordPaymentDialog({
  paymentId, amountDue, amountPaid, remaining, open, onOpenChange
}: RecordPaymentDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [method, setMethod]   = useState<string>('cash')

  const symbol = 'Rs.'
  const todayStr = new Date().toISOString().split('T')[0]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd     = new FormData(e.currentTarget)
    const amount = parseFloat(fd.get('amount') as string)

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    startTransition(async () => {
      const res = await recordPaymentAction(paymentId, {
        amount,
        paid_on:        fd.get('paid_on') as string,
        payment_method: method as PaymentMethod,
        notes:          fd.get('notes') as string,
      })
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          onOpenChange(false)
          router.refresh()
        }, 1500)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment transaction for this billing month.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <p className="font-semibold text-green-700">Payment recorded!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Total Due',  value: formatCurrency(amountDue, symbol),   color: '' },
                { label: 'Paid So Far', value: formatCurrency(amountPaid, symbol), color: 'text-green-600' },
                { label: 'Remaining',  value: formatCurrency(remaining, symbol),   color: remaining > 0 ? 'text-red-600' : 'text-green-600' },
              ].map(s => (
                <div key={s.label} className="bg-muted rounded-lg p-2">
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount Received (Rs.) *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="1"
                step="0.01"
                required
                placeholder={remaining.toString()}
                defaultValue={remaining > 0 ? remaining : ''}
                className="text-lg font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="paid_on">Date *</Label>
                <Input id="paid_on" name="paid_on" type="date" required defaultValue={todayStr} />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select value={method} onValueChange={(v) => setMethod(v ?? 'cash')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" name="notes" rows={2} placeholder="Any notes…" />
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-500">
                {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : 'Record Payment'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

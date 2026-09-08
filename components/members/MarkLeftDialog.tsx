'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { markMemberLeftAction } from '@/lib/actions/members'
import { AlertCircle, Loader2 } from 'lucide-react'

interface MarkLeftDialogProps {
  memberId: string
  memberName: string
  depositAmount: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function MarkLeftDialog({
  memberId, memberName, depositAmount, open, onOpenChange
}: MarkLeftDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [refundDeposit, setRefundDeposit] = useState(false)

  const todayStr = new Date().toISOString().split('T')[0]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const leavingDate  = fd.get('leaving_date') as string
    const refundAmount = parseFloat(fd.get('refund_amount') as string) || 0
    const refundDate   = fd.get('refund_date') as string

    startTransition(async () => {
      const res = await markMemberLeftAction(
        memberId,
        leavingDate,
        refundDeposit ? { amount: refundAmount, date: refundDate } : undefined
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mark {memberName} as Left</DialogTitle>
          <DialogDescription>
            This will mark the member as left and free up their assigned space. Their payment history will be preserved.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="leaving_date">Leaving Date *</Label>
            <Input id="leaving_date" name="leaving_date" type="date" required defaultValue={todayStr} />
          </div>

          {depositAmount > 0 && (
            <div className="space-y-3 p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="refund_deposit"
                  className="w-4 h-4 accent-indigo-600"
                  checked={refundDeposit}
                  onChange={e => setRefundDeposit(e.target.checked)}
                />
                <Label htmlFor="refund_deposit" className="cursor-pointer">
                  Refund security deposit (Rs. {depositAmount.toLocaleString()})
                </Label>
              </div>
              {refundDeposit && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="refund_amount">Refund Amount (Rs.)</Label>
                    <Input
                      id="refund_amount"
                      name="refund_amount"
                      type="number"
                      min="0"
                      defaultValue={depositAmount}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="refund_date">Refund Date</Label>
                    <Input id="refund_date" name="refund_date" type="date" defaultValue={todayStr} />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="destructive" disabled={isPending} className="flex-1">
              {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</> : 'Confirm — Mark as Left'}
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

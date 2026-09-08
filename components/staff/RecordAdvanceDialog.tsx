'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { recordAdvanceAction } from '@/lib/actions/staff'
import { AlertCircle, Loader2 } from 'lucide-react'

interface RecordAdvanceDialogProps {
  staffId: string
  staffName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function RecordAdvanceDialog({
  staffId,
  staffName,
  open,
  onOpenChange,
}: RecordAdvanceDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const todayStr = new Date().toISOString().split('T')[0]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    const values = {
      advance_date: fd.get('advance_date') as string,
      amount: parseFloat(fd.get('amount') as string) || 0,
      reason: fd.get('reason') as string,
      notes: fd.get('notes') as string,
    }

    if (values.amount <= 0) {
      setError('Please enter an amount greater than 0.')
      return
    }

    startTransition(async () => {
      const res = await recordAdvanceAction(staffId, values)
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
          <DialogTitle>Record Advance for {staffName}</DialogTitle>
          <DialogDescription>
            Record a salary advance given to this staff member. Outstanding advances can be deducted when disbursing monthly salaries.
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
            <Label htmlFor="advance_date">Advance Date *</Label>
            <Input id="advance_date" name="advance_date" type="date" required defaultValue={todayStr} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (Rs.) *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="1"
              step="1"
              required
              placeholder="e.g. 5000"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason / Purpose</Label>
            <Input
              id="reason"
              name="reason"
              placeholder="e.g. Medical emergency, Eid advance"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional details..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500"
            >
              {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : 'Record Advance'}
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

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { markStaffLeftAction } from '@/lib/actions/staff'
import { AlertCircle, Loader2 } from 'lucide-react'

interface MarkStaffLeftDialogProps {
  staffId: string
  staffName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function MarkStaffLeftDialog({
  staffId,
  staffName,
  open,
  onOpenChange,
}: MarkStaffLeftDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const todayStr = new Date().toISOString().split('T')[0]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const leavingDate = fd.get('leaving_date') as string

    startTransition(async () => {
      const res = await markStaffLeftAction(staffId, leavingDate)
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
          <DialogTitle>Mark {staffName} as Left</DialogTitle>
          <DialogDescription>
            This will mark the staff member as inactive. Their salary records and advance history will be preserved.
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

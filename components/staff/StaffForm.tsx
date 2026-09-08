'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { createStaffAction, updateStaffAction } from '@/lib/actions/staff'
import type { Staff } from '@/types'
import { AlertCircle, Loader2 } from 'lucide-react'

interface StaffFormProps {
  staff?: Staff
}

export default function StaffForm({ staff }: StaffFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const todayStr = new Date().toISOString().split('T')[0]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    const values = {
      full_name:      fd.get('full_name') as string,
      phone:          fd.get('phone') as string,
      joining_date:   fd.get('joining_date') as string,
      monthly_salary: parseFloat(fd.get('monthly_salary') as string) || 0,
      role:           fd.get('role') as string,
      notes:          fd.get('notes') as string,
    }

    startTransition(async () => {
      const res = staff
        ? await updateStaffAction(staff.id, values)
        : await createStaffAction(values)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Personal Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input id="full_name" name="full_name" required defaultValue={staff?.full_name} placeholder="Staff member name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={staff?.phone ?? ''} placeholder="03xx-xxxxxxx" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role / Designation</Label>
              <Input id="role" name="role" defaultValue={staff?.role ?? ''} placeholder="Office Boy, Receptionist…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="joining_date">Joining Date *</Label>
              <Input id="joining_date" name="joining_date" type="date" required defaultValue={staff?.joining_date ?? todayStr} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Salary</h2>
          <div className="space-y-1.5 max-w-xs">
            <Label htmlFor="monthly_salary">Monthly Salary (Rs.) *</Label>
            <Input
              id="monthly_salary"
              name="monthly_salary"
              type="number"
              min="0"
              required
              defaultValue={staff?.monthly_salary ?? ''}
              placeholder="25000"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" defaultValue={staff?.notes ?? ''} rows={3} placeholder="Additional notes…" />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-500">
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : staff ? 'Save Changes' : 'Add Staff'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}

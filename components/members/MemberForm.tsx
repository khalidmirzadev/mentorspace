'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { createMemberAction, updateMemberAction } from '@/lib/actions/members'
import type { Member, SeatPlanType } from '@/types'
import { AlertCircle, Loader2, Sun, Moon, Zap } from 'lucide-react'

interface SeatOption {
  id: string
  seat_number: string
  monthly_rate: number | null
  morning_available?: boolean
  evening_available?: boolean
  dedicated_available?: boolean
}

interface RoomOption {
  id: string
  name: string
  room_type: string
  monthly_rate: number | null
}

interface MemberFormProps {
  member?: Member & {
    assigned_seat?: { id: string; seat_number: string } | null
    assigned_room?: { id: string; name: string } | null
  }
  availableSeats: SeatOption[]
  availableRooms: RoomOption[]
  initialSeatId?: string
  initialPlan?: SeatPlanType
}

export default function MemberForm({
  member,
  availableSeats,
  availableRooms,
  initialSeatId,
  initialPlan,
}: MemberFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [spaceType, setSpaceType] = useState<'individual_seat' | 'complete_room'>(
    member?.space_type ?? 'individual_seat'
  )
  const [planType, setPlanType] = useState<SeatPlanType>(
    member?.plan_type ?? initialPlan ?? 'dedicated'
  )
  const [seatId, setSeatId] = useState(member?.assigned_seat_id ?? initialSeatId ?? '')
  const [roomId, setRoomId] = useState(member?.assigned_room_id ?? '')

  // Filter available seats based on the selected plan
  const eligibleSeats = useMemo(() => {
    return availableSeats.filter(s => {
      // Always include currently assigned seat for this member
      if (member?.assigned_seat_id === s.id) return true
      if (initialSeatId === s.id) return true

      if (planType === 'morning') return s.morning_available !== false
      if (planType === 'evening') return s.evening_available !== false
      if (planType === 'dedicated') return s.dedicated_available !== false
      return true
    })
  }, [availableSeats, planType, member?.assigned_seat_id, initialSeatId])

  // Auto-fill monthly amount when seat/room is selected
  const selectedSeat = availableSeats.find(s => s.id === seatId)
  const selectedRoom = availableRooms.find(r => r.id === roomId)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    const values = {
      full_name:        fd.get('full_name') as string,
      phone:            fd.get('phone') as string,
      email:            fd.get('email') as string,
      joining_date:     fd.get('joining_date') as string,
      space_type:       spaceType,
      plan_type:        spaceType === 'individual_seat' ? planType : 'dedicated',
      assigned_seat_id: spaceType === 'individual_seat' ? seatId : '',
      assigned_room_id: spaceType === 'complete_room'   ? roomId : '',
      monthly_amount:   parseFloat(fd.get('monthly_amount') as string) || 0,
      security_deposit: parseFloat(fd.get('security_deposit') as string) || 0,
      notes:            fd.get('notes') as string,
    }

    startTransition(async () => {
      const res = member
        ? await updateMemberAction(member.id, values)
        : await createMemberAction(values)
      if (res?.error) setError(res.error)
    })
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Personal Details */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Personal Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input id="full_name" name="full_name" required defaultValue={member?.full_name} placeholder="Ahmed Khan" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" defaultValue={member?.phone ?? ''} placeholder="03xx-xxxxxxx" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={member?.email ?? ''} placeholder="email@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="joining_date">Joining Date *</Label>
              <Input id="joining_date" name="joining_date" type="date" required defaultValue={member?.joining_date ?? todayStr} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workspace & Shift Assignment */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Workspace & Shift Assignment</h2>

          <div className="space-y-1.5">
            <Label>Workspace Type *</Label>
            <Select value={spaceType} onValueChange={(v) => v && setSpaceType(v as any)}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual_seat">Shared Space (Seat 1–19)</SelectItem>
                <SelectItem value="complete_room">Private Room / Office</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* If Individual Seat: Select Shift Plan */}
          {spaceType === 'individual_seat' && (
            <div className="space-y-3 pt-1">
              <Label>Shift Plan *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'morning',
                    label: 'Morning Shift',
                    time: '9:00 AM – 6:00 PM',
                    icon: Sun,
                    color: 'text-amber-500',
                  },
                  {
                    id: 'evening',
                    label: 'Evening Shift',
                    time: '6:00 PM – 3:00 AM',
                    icon: Moon,
                    color: 'text-indigo-500',
                  },
                  {
                    id: 'dedicated',
                    label: 'Dedicated (24H)',
                    time: 'Full-time access',
                    icon: Zap,
                    color: 'text-purple-500',
                  },
                ].map(plan => {
                  const isSelected = planType === plan.id
                  const Icon = plan.icon
                  return (
                    <button
                      type="button"
                      key={plan.id}
                      onClick={() => setPlanType(plan.id as SeatPlanType)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-600'
                          : 'border-border bg-card hover:border-border/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${plan.color}`} />
                        <span className="font-semibold text-xs">{plan.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{plan.time}</p>
                    </button>
                  )
                })}
              </div>

              {/* Assign Specific Physical Seat */}
              <div className="space-y-1.5 pt-2">
                <Label>Select Physical Desk (Seat 1–19) *</Label>
                <Select value={seatId} onValueChange={(v) => setSeatId(v ?? '')}>
                  <SelectTrigger className="w-full sm:w-80">
                    <SelectValue placeholder="Choose an available seat…" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleSeats.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.seat_number}
                        {s.monthly_rate ? ` — Rs. ${s.monthly_rate.toLocaleString()}/mo` : ''}
                      </SelectItem>
                    ))}
                    {eligibleSeats.length === 0 && (
                      <SelectItem value="" disabled>
                        No seats available for {planType} shift
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Showing {eligibleSeats.length} physical desks available for the <span className="font-medium capitalize">{planType}</span> plan.
                </p>
              </div>
            </div>
          )}

          {/* If Complete Room */}
          {spaceType === 'complete_room' && (
            <div className="space-y-1.5 pt-1">
              <Label>Assign Private Room *</Label>
              <Select value={roomId} onValueChange={(v) => setRoomId(v ?? '')}>
                <SelectTrigger className="w-full sm:w-80">
                  <SelectValue placeholder="Select a room…" />
                </SelectTrigger>
                <SelectContent>
                  {member?.assigned_room && !availableRooms.find(r => r.id === member.assigned_room_id) && (
                    <SelectItem value={member.assigned_room_id!}>
                      {(member.assigned_room as any).name} (current)
                    </SelectItem>
                  )}
                  {availableRooms.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} ({r.room_type})
                      {r.monthly_rate ? ` — Rs. ${r.monthly_rate.toLocaleString()}/mo` : ''}
                    </SelectItem>
                  ))}
                  {availableRooms.length === 0 && !member?.assigned_room_id && (
                    <SelectItem value="" disabled>No private rooms available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financials */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Financials & Billing</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="monthly_amount">Monthly Fee (Rs.) *</Label>
              <Input
                id="monthly_amount"
                name="monthly_amount"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={
                  member?.monthly_amount ??
                  (spaceType === 'individual_seat' ? selectedSeat?.monthly_rate : selectedRoom?.monthly_rate) ??
                  ''
                }
                placeholder="15000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="security_deposit">Security Deposit (Rs.)</Label>
              <Input
                id="security_deposit"
                name="security_deposit"
                type="number"
                min="0"
                step="0.01"
                defaultValue={member?.security_deposit ?? 0}
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="p-5 space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={member?.notes ?? ''}
            placeholder="Any additional requirements or notes…"
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-500"
        >
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : member ? 'Save Changes' : 'Add Member'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

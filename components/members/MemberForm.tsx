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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { createMemberAction, updateMemberAction } from '@/lib/actions/members'
import type { Member } from '@/types'
import { AlertCircle, Loader2 } from 'lucide-react'

interface Seat { id: string; seat_number: string; room: { name: string } | null; monthly_rate: number | null }
interface Room { id: string; name: string; room_type: string; monthly_rate: number | null }

interface MemberFormProps {
  member?: Member & { assigned_seat?: { id: string; seat_number: string } | null; assigned_room?: { id: string; name: string } | null }
  availableSeats: Seat[]
  availableRooms: Room[]
}

export default function MemberForm({ member, availableSeats, availableRooms }: MemberFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [spaceType, setSpaceType] = useState<'individual_seat' | 'complete_room'>(
    member?.space_type ?? 'individual_seat'
  )
  const [seatId, setSeatId]   = useState(member?.assigned_seat_id ?? '')
  const [roomId, setRoomId]   = useState(member?.assigned_room_id ?? '')

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

      {/* Space Assignment */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Space Assignment</h2>

          <div className="space-y-1.5">
            <Label>Space Type *</Label>
            <Select value={spaceType} onValueChange={(v: any) => setSpaceType(v)}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual_seat">Individual Seat</SelectItem>
                <SelectItem value="complete_room">Complete Room</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {spaceType === 'individual_seat' && (
            <div className="space-y-1.5">
              <Label>Assign Seat</Label>
              <Select value={seatId} onValueChange={(v) => setSeatId(v ?? '')}>
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue placeholder="Select a seat…" />
                </SelectTrigger>
                <SelectContent>
                  {/* Include currently assigned seat even if not in "available" list */}
                  {member?.assigned_seat && !availableSeats.find(s => s.id === member.assigned_seat_id) && (
                    <SelectItem value={member.assigned_seat_id!}>
                      {(member.assigned_seat as any).seat_number} (current)
                    </SelectItem>
                  )}
                  {availableSeats.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.seat_number}{s.room ? ` — ${s.room.name}` : ''}
                      {s.monthly_rate ? ` (Rs. ${s.monthly_rate})` : ''}
                    </SelectItem>
                  ))}
                  {availableSeats.length === 0 && !member?.assigned_seat_id && (
                    <SelectItem value="" disabled>No seats available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {spaceType === 'complete_room' && (
            <div className="space-y-1.5">
              <Label>Assign Room</Label>
              <Select value={roomId} onValueChange={(v) => setRoomId(v ?? '')}>
                <SelectTrigger className="w-full sm:w-72">
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
                      {r.monthly_rate ? ` — Rs. ${r.monthly_rate}` : ''}
                    </SelectItem>
                  ))}
                  {availableRooms.length === 0 && !member?.assigned_room_id && (
                    <SelectItem value="" disabled>No rooms available</SelectItem>
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
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Financials</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="monthly_amount">Monthly Amount (Rs.) *</Label>
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
              {(spaceType === 'individual_seat' ? selectedSeat : selectedRoom)?.monthly_rate && (
                <p className="text-xs text-muted-foreground">
                  Listed rate: Rs. {(spaceType === 'individual_seat' ? selectedSeat : selectedRoom)?.monthly_rate}
                </p>
              )}
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
            placeholder="Any additional notes…"
            rows={3}
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

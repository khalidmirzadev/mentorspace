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
import { createSeatAction, updateSeatAction } from '@/lib/actions/spaces'
import type { Seat, Room } from '@/types'
import { AlertCircle, Loader2 } from 'lucide-react'

interface SeatFormProps {
  seat?: Seat
  rooms: Room[]
}

export default function SeatForm({ seat, rooms }: SeatFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [roomId, setRoomId] = useState<string>(seat?.room_id ?? 'none')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    const values = {
      seat_number:  fd.get('seat_number') as string,
      room_id:      roomId === 'none' ? '' : roomId,
      monthly_rate: fd.get('monthly_rate') ? parseFloat(fd.get('monthly_rate') as string) : null,
      description:  fd.get('description') as string,
    }

    if (!values.seat_number.trim()) {
      setError('Please provide a seat number or identifier.')
      return
    }

    startTransition(async () => {
      const res = seat
        ? await updateSeatAction(seat.id, values)
        : await createSeatAction(values)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Seat Details</h2>

          <div className="space-y-1.5">
            <Label htmlFor="seat_number">Seat Identifier / Number *</Label>
            <Input
              id="seat_number"
              name="seat_number"
              required
              defaultValue={seat?.seat_number}
              placeholder="e.g. S-01, Desk-12, Hall-A-3"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="room">Located In Room / Hall</Label>
            <Select value={roomId} onValueChange={(v) => setRoomId(v ?? 'none')}>
              <SelectTrigger>
                <SelectValue placeholder="Select room or open hall..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Open Area / Main Hall (No specific room)</SelectItem>
                {rooms.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} ({r.room_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="monthly_rate">Standard Monthly Rate (Rs.)</Label>
            <Input
              id="monthly_rate"
              name="monthly_rate"
              type="number"
              min="0"
              step="0.01"
              defaultValue={seat?.monthly_rate ?? ''}
              placeholder="e.g. 15000"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description / Location Notes</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={seat?.description ?? ''}
              placeholder="e.g. Window side corner desk, ergonomic chair, power outlets nearby..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-500"
        >
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : seat ? 'Save Changes' : 'Create Seat'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

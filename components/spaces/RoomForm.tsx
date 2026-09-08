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
import { createRoomAction, updateRoomAction } from '@/lib/actions/spaces'
import type { Room, RoomType } from '@/types'
import { AlertCircle, Loader2 } from 'lucide-react'

interface RoomFormProps {
  room?: Room
}

export default function RoomForm({ room }: RoomFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [roomType, setRoomType] = useState<RoomType>(room?.room_type ?? 'private')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    const values = {
      name:         fd.get('name') as string,
      description:  fd.get('description') as string,
      capacity:     parseInt(fd.get('capacity') as string, 10) || 1,
      room_type:    roomType,
      monthly_rate: fd.get('monthly_rate') ? parseFloat(fd.get('monthly_rate') as string) : null,
    }

    if (!values.name.trim()) {
      setError('Please provide a room name.')
      return
    }

    startTransition(async () => {
      const res = room
        ? await updateRoomAction(room.id, values)
        : await createRoomAction(values)
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
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Room Details</h2>

          <div className="space-y-1.5">
            <Label htmlFor="name">Room Name / Number *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={room?.name}
              placeholder="e.g. Executive Suite 1, Meeting Room A, Room 102"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="room_type">Room Type *</Label>
              <Select value={roomType} onValueChange={(v) => v && setRoomType(v as RoomType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private Office</SelectItem>
                  <SelectItem value="shared">Shared Space</SelectItem>
                  <SelectItem value="conference">Conference / Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="capacity">Capacity (Persons) *</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                required
                defaultValue={room?.capacity ?? 1}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="monthly_rate">Standard Monthly Rate (Rs.)</Label>
            <Input
              id="monthly_rate"
              name="monthly_rate"
              type="number"
              min="0"
              step="0.01"
              defaultValue={room?.monthly_rate ?? ''}
              placeholder="e.g. 50000"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description / Amenities</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={room?.description ?? ''}
              placeholder="e.g. Glass partitioned room with AC, executive chairs and white board..."
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
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : room ? 'Save Changes' : 'Create Room'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

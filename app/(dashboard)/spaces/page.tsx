import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getPhysicalSeatsMatrix, getWorkspaceOccupancyStats } from '@/lib/queries/spaces'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, DoorOpen, Sofa, Sun, Moon, Zap, Layers } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/formatters'
import SeatMatrix from '@/components/spaces/SeatMatrix'

export const metadata: Metadata = { title: 'Spaces & Seat Management' }

export default async function SpacesPage() {
  const supabase = await createClient()

  const [seatsMatrix, shiftStats, { data: rooms }] = await Promise.all([
    getPhysicalSeatsMatrix(),
    getWorkspaceOccupancyStats(),
    supabase
      .from('rooms')
      .select(`*, current_member:members!members_assigned_room_id_fkey(id,full_name,status)`)
      .eq('is_active', true)
      .order('name'),
  ])

  const occupiedRooms = rooms?.filter(r => r.current_member?.some((m: {status:string}) => m.status === 'active')).length ?? 0
  const totalRooms = rooms?.length ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workspace & Seats</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            19 physical desks, morning/evening/dedicated shifts, and private rooms
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/members/new">
            <Button className="bg-indigo-600 hover:bg-indigo-500" size="sm">
              <Plus className="w-3.5 h-3.5 mr-1" /> Assign Member
            </Button>
          </Link>
          <Link href="/spaces/rooms/new">
            <Button variant="outline" size="sm">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Private Room
            </Button>
          </Link>
        </div>
      </div>

      {/* Shift Capacity Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
              <Sofa className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{shiftStats.total_shared_seats}</p>
              <p className="text-xs text-muted-foreground">Physical Desks</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold">
                {shiftStats.morning_occupied} <span className="text-xs font-normal text-muted-foreground">/ {shiftStats.morning_occupied + shiftStats.morning_available}</span>
              </p>
              <p className="text-xs text-muted-foreground">Morning (9am–6pm)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold">
                {shiftStats.evening_occupied} <span className="text-xs font-normal text-muted-foreground">/ {shiftStats.evening_occupied + shiftStats.evening_available}</span>
              </p>
              <p className="text-xs text-muted-foreground">Evening (6pm–3am)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{shiftStats.dedicated_occupied}</p>
              <p className="text-xs text-muted-foreground">Dedicated (24H)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1 border-indigo-200 bg-indigo-50/30 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-indigo-700 dark:text-indigo-400">
                {shiftStats.available_shift_slots} <span className="text-xs font-normal text-muted-foreground">/ {shiftStats.total_shift_slots}</span>
              </p>
              <p className="text-xs text-muted-foreground">Slots Available</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 19 Physical Desks Interactive Matrix */}
      <SeatMatrix seats={seatsMatrix} />

      {/* Private Rooms Section */}
      <div className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <DoorOpen className="w-4 h-4 text-indigo-600" /> Private Offices & Rooms ({rooms?.length ?? 0})
          </h2>
          <Link href="/spaces/rooms/new">
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" /> Add Room
            </Button>
          </Link>
        </div>

        {rooms && rooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.map((room: any) => {
              const activeMember = room.current_member?.find((m: any) => m.status === 'active')
              const isOccupied = !!activeMember
              return (
                <Card
                  key={room.id}
                  className={`hover:shadow-md transition-all ${
                    isOccupied ? 'ring-1 ring-red-200 dark:ring-red-900/40' : 'ring-1 ring-green-200 dark:ring-green-900/40'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <DoorOpen className="w-5 h-5 text-slate-500" />
                      </div>
                      <Badge
                        variant={isOccupied ? 'destructive' : 'outline'}
                        className={isOccupied ? '' : 'border-green-300 text-green-700 bg-green-50'}
                      >
                        {isOccupied ? 'Occupied' : 'Available'}
                      </Badge>
                    </div>
                    <p className="font-semibold text-sm">{room.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{room.room_type} room · Cap: {room.capacity}</p>
                    {isOccupied && (
                      <Link href={`/members/${activeMember.id}`}>
                        <p className="text-xs text-indigo-600 hover:underline mt-2 font-medium truncate">
                          {activeMember.full_name}
                        </p>
                      </Link>
                    )}
                    {room.monthly_rate && (
                      <p className="text-xs text-muted-foreground mt-1">{formatCurrency(room.monthly_rate, 'Rs.')}/mo</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              No private rooms configured yet. You can add private executive suites or meeting rooms.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

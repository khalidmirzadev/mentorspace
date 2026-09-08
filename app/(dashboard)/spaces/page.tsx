import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, MapPin, DoorOpen, Sofa } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/formatters'

export const metadata: Metadata = { title: 'Spaces' }

export default async function SpacesPage() {
  const supabase = await createClient()

  const [{ data: rooms }, { data: seats }] = await Promise.all([
    supabase.from('rooms').select(`*, current_member:members!members_assigned_room_id_fkey(id,full_name,status)`).eq('is_active', true).order('name'),
    supabase.from('seats').select(`*, room:rooms(name), current_member:members!members_assigned_seat_id_fkey(id,full_name,status)`).eq('is_active', true).order('seat_number'),
  ])

  const occupiedRooms = rooms?.filter(r => r.current_member?.some((m: {status:string}) => m.status === 'active')).length ?? 0
  const occupiedSeats = seats?.filter(s => s.current_member?.some((m: {status:string}) => m.status === 'active')).length ?? 0
  const totalRooms = rooms?.length ?? 0
  const totalSeats = seats?.length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Spaces</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Rooms and individual seats</p>
        </div>
        <div className="flex gap-2">
          <Link href="/spaces/rooms/new">
            <Button variant="outline" size="sm"><Plus className="w-3.5 h-3.5 mr-1" /> Room</Button>
          </Link>
          <Link href="/spaces/seats/new">
            <Button className="bg-indigo-600 hover:bg-indigo-500" size="sm"><Plus className="w-3.5 h-3.5 mr-1" /> Seat</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Rooms',     value: totalRooms,               icon: DoorOpen, color: 'text-indigo-600' },
          { label: 'Occupied Rooms',  value: occupiedRooms,            icon: DoorOpen, color: 'text-red-500' },
          { label: 'Total Seats',     value: totalSeats,               icon: Sofa,     color: 'text-indigo-600' },
          { label: 'Occupied Seats',  value: occupiedSeats,            icon: Sofa,     color: 'text-red-500' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rooms Grid */}
      {rooms && rooms.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <DoorOpen className="w-4 h-4" /> Rooms
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.map((room: any) => {
              const activeMember = room.current_member?.find((m: any) => m.status === 'active')
              const isOccupied = !!activeMember
              return (
                <Card key={room.id} className={`hover:shadow-md transition-all ${isOccupied ? 'ring-1 ring-red-200 dark:ring-red-900/40' : 'ring-1 ring-green-200 dark:ring-green-900/40'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <DoorOpen className="w-5 h-5 text-slate-500" />
                      </div>
                      <Badge variant={isOccupied ? 'destructive' : 'outline'}
                        className={isOccupied ? '' : 'border-green-300 text-green-700 bg-green-50'}>
                        {isOccupied ? 'Occupied' : 'Available'}
                      </Badge>
                    </div>
                    <p className="font-semibold text-sm">{room.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{room.room_type} room</p>
                    {isOccupied && (
                      <p className="text-xs text-indigo-600 mt-2 font-medium truncate">{activeMember.full_name}</p>
                    )}
                    {room.monthly_rate && (
                      <p className="text-xs text-muted-foreground mt-1">{formatCurrency(room.monthly_rate, 'Rs.')}/mo</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Seats Grid */}
      {seats && seats.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Sofa className="w-4 h-4" /> Individual Seats
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {seats.map((seat: any) => {
              const activeMember = seat.current_member?.find((m: any) => m.status === 'active')
              const isOccupied = !!activeMember
              return (
                <Card key={seat.id} className={`hover:shadow-md transition-all ${isOccupied ? 'ring-1 ring-red-200 dark:ring-red-900/40' : 'ring-1 ring-green-200 dark:ring-green-900/40'}`}>
                  <CardContent className="p-3 text-center">
                    <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${isOccupied ? 'bg-red-100 dark:bg-red-950/40' : 'bg-green-100 dark:bg-green-950/40'}`}>
                      <Sofa className={`w-5 h-5 ${isOccupied ? 'text-red-500' : 'text-green-600'}`} />
                    </div>
                    <p className="font-bold text-sm">{seat.seat_number}</p>
                    {seat.room && <p className="text-[10px] text-muted-foreground">{seat.room.name}</p>}
                    {isOccupied && <p className="text-[10px] text-indigo-600 mt-1 font-medium truncate">{activeMember.full_name}</p>}
                    <Badge
                      variant="outline"
                      className={`mt-1.5 text-[10px] ${isOccupied ? 'border-red-200 text-red-600' : 'border-green-200 text-green-600'}`}>
                      {isOccupied ? 'Taken' : 'Free'}
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

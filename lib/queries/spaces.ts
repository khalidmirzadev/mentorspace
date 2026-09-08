import { createClient } from '@/lib/supabase/server'
import type { SeatWithShifts, SeatPlanType, Room } from '@/types'

export async function getPhysicalSeatsMatrix(): Promise<SeatWithShifts[]> {
  const supabase = await createClient()

  // 1. Fetch all seats
  const { data: seatsData } = await supabase
    .from('seats')
    .select('*')
    .eq('is_active', true)

  // 2. Fetch active members assigned to seats
  const { data: membersData } = await supabase
    .from('members')
    .select('id, full_name, phone, joining_date, monthly_amount, assigned_seat_id, plan_type, status')
    .eq('status', 'active')
    .eq('space_type', 'individual_seat')
    .not('assigned_seat_id', 'is', null)

  // Build a map of seatId -> members[]
  const seatMembersMap: Record<string, any[]> = {}
  for (const m of membersData ?? []) {
    if (!m.assigned_seat_id) continue
    if (!seatMembersMap[m.assigned_seat_id]) seatMembersMap[m.assigned_seat_id] = []
    seatMembersMap[m.assigned_seat_id].push(m)
  }

  // If database doesn't have seats yet (e.g. before migration), generate virtual Seat 1..19
  const baseSeats = seatsData && seatsData.length > 0 ? seatsData : Array.from({ length: 19 }, (_, i) => ({
    id: `virtual-seat-${i + 1}`,
    seat_number: `Seat ${i + 1}`,
    room_id: null,
    description: `Shared workspace physical desk #${i + 1}`,
    monthly_rate: null,
    is_active: true,
  }))

  const result: SeatWithShifts[] = baseSeats.map((seat: any) => {
    const seatNum = seat.seat_number ?? ''
    const seatIndex = parseInt(seatNum.replace(/\D/g, ''), 10) || 999
    const assigned = seatMembersMap[seat.id] ?? []

    const morningMember = assigned.find(m => m.plan_type === 'morning') || null
    const eveningMember = assigned.find(m => m.plan_type === 'evening') || null
    const dedicatedMember = assigned.find(m => !m.plan_type || m.plan_type === 'dedicated') || null

    const morningAvailable = !morningMember && !dedicatedMember
    const eveningAvailable = !eveningMember && !dedicatedMember
    const dedicatedAvailable = !morningMember && !eveningMember && !dedicatedMember

    return {
      id: seat.id,
      seat_number: seat.seat_number,
      seat_index: seatIndex,
      room_id: seat.room_id,
      description: seat.description,
      monthly_rate: seat.monthly_rate,
      is_active: seat.is_active,
      morning_member: morningMember,
      evening_member: eveningMember,
      dedicated_member: dedicatedMember,
      morning_available: morningAvailable,
      evening_available: eveningAvailable,
      dedicated_available: dedicatedAvailable,
    }
  })

  // Sort by seat index (Seat 1 to Seat 19)
  result.sort((a, b) => a.seat_index - b.seat_index)
  return result
}

export async function getAvailableSeatsForPlan(
  plan: SeatPlanType = 'dedicated',
  excludeMemberId?: string
) {
  const matrix = await getPhysicalSeatsMatrix()

  return matrix
    .filter(seat => {
      // If the member being edited is already on this seat & shift, keep it available for them
      if (excludeMemberId) {
        if (plan === 'morning' && seat.morning_member?.id === excludeMemberId) return true
        if (plan === 'evening' && seat.evening_member?.id === excludeMemberId) return true
        if (plan === 'dedicated' && seat.dedicated_member?.id === excludeMemberId) return true
      }

      if (plan === 'morning') return seat.morning_available
      if (plan === 'evening') return seat.evening_available
      if (plan === 'dedicated') return seat.dedicated_available
      return false
    })
    .map(seat => ({
      id: seat.id,
      seat_number: seat.seat_number,
      monthly_rate: seat.monthly_rate,
      description: seat.description,
      morning_available: seat.morning_available,
      evening_available: seat.evening_available,
      dedicated_available: seat.dedicated_available,
    }))
}

export async function getWorkspaceOccupancyStats() {
  const matrix = await getPhysicalSeatsMatrix()
  const totalSeats = matrix.length || 19

  let morningOccupied = 0
  let eveningOccupied = 0
  let dedicatedOccupied = 0

  for (const seat of matrix) {
    if (seat.dedicated_member) {
      dedicatedOccupied++
    } else {
      if (seat.morning_member) morningOccupied++
      if (seat.evening_member) eveningOccupied++
    }
  }

  const morningAvailable = totalSeats - morningOccupied - dedicatedOccupied
  const eveningAvailable = totalSeats - eveningOccupied - dedicatedOccupied

  const totalShiftSlots = totalSeats * 2 // 38 slots
  const occupiedShiftSlots = (morningOccupied + eveningOccupied) + (dedicatedOccupied * 2)
  const availableShiftSlots = Math.max(0, totalShiftSlots - occupiedShiftSlots)

  return {
    total_shared_seats: totalSeats,
    morning_occupied: morningOccupied,
    morning_available: Math.max(0, morningAvailable),
    evening_occupied: eveningOccupied,
    evening_available: Math.max(0, eveningAvailable),
    dedicated_occupied: dedicatedOccupied,
    total_shift_slots: totalShiftSlots,
    occupied_shift_slots: occupiedShiftSlots,
    available_shift_slots: availableShiftSlots,
  }
}

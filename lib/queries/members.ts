import { createClient } from '@/lib/supabase/server'
import type { Member, MemberPayment, PaymentTransaction } from '@/types'

export async function getMember(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('members')
    .select(`
      *,
      assigned_seat:seats(id, seat_number, room:rooms(name)),
      assigned_room:rooms(id, name, room_type)
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as Member & {
    assigned_seat?: { id: string; seat_number: string; room?: { name: string } | null } | null
    assigned_room?: { id: string; name: string; room_type: string } | null
  }
}

export async function getMemberPayments(memberId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('member_payments')
    .select(`*, transactions:payment_transactions(*)`)
    .eq('member_id', memberId)
    .order('billing_month', { ascending: false })

  return (data ?? []).map((p: any) => ({
    ...p,
    remaining: p.amount_due - p.amount_paid,
    transactions: p.transactions ?? [],
  })) as (MemberPayment & { remaining: number; transactions: PaymentTransaction[] })[]
}

export async function getPaymentWithTransactions(paymentId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('member_payments')
    .select(`
      *,
      member:members(id, full_name, phone, email, monthly_amount),
      transactions:payment_transactions(*)
    `)
    .eq('id', paymentId)
    .single()

  if (!data) return null
  return {
    ...data,
    member: Array.isArray(data.member) ? (data.member[0] ?? null) : (data.member ?? null),
    remaining: data.amount_due - data.amount_paid,
    transactions: (data as any).transactions ?? [],
  } as unknown as MemberPayment & {
    member: { id: string; full_name: string; phone: string | null; email: string | null; monthly_amount: number } | null
    remaining: number
    transactions: PaymentTransaction[]
  }
}

export async function getAvailableSeats(excludeMemberId?: string) {
  const supabase = await createClient()
  // Seats not currently assigned to an active member (or assigned to this member)
  const { data: seats } = await supabase
    .from('seats')
    .select('id, seat_number, room:rooms(name), monthly_rate')
    .eq('is_active', true)
    .order('seat_number')

  const { data: occupiedSeats } = await supabase
    .from('members')
    .select('assigned_seat_id')
    .eq('status', 'active')
    .not('assigned_seat_id', 'is', null)

  const occupiedIds = new Set(
    (occupiedSeats ?? [])
      .map((m: any) => m.assigned_seat_id)
      .filter((id: string) => id !== excludeMemberId)
  )

  return (seats ?? [])
    .filter((s: any) => !occupiedIds.has(s.id))
    .map((s: any) => ({
      id: s.id,
      seat_number: s.seat_number,
      monthly_rate: s.monthly_rate,
      room: (Array.isArray(s.room) ? s.room[0] : s.room) ?? null,
    })) as {
      id: string; seat_number: string; monthly_rate: number | null
      room: { name: string } | null
    }[]
}

export async function getAvailableRooms(excludeMemberId?: string) {
  const supabase = await createClient()
  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, name, room_type, monthly_rate')
    .eq('is_active', true)
    .order('name')

  const { data: occupiedRooms } = await supabase
    .from('members')
    .select('assigned_room_id')
    .eq('status', 'active')
    .not('assigned_room_id', 'is', null)

  const occupiedIds = new Set(
    (occupiedRooms ?? [])
      .map((m: any) => m.assigned_room_id)
      .filter((id: string) => id !== excludeMemberId)
  )

  return (rooms ?? []).filter((r: any) => !occupiedIds.has(r.id)) as {
    id: string; name: string; room_type: string; monthly_rate: number | null
  }[]
}

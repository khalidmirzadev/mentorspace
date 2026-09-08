'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { MemberFormValues, SeatPlanType } from '@/types'

/** Helper to validate that a seat is available for the given plan */
async function validateSeatAvailability(
  supabase: any,
  seatId: string,
  planType: SeatPlanType,
  excludeMemberId?: string
) {
  let query = supabase
    .from('members')
    .select('id, full_name, plan_type')
    .eq('assigned_seat_id', seatId)
    .eq('status', 'active')

  if (excludeMemberId) {
    query = query.neq('id', excludeMemberId)
  }

  const { data: activeOnSeat } = await query

  if (!activeOnSeat || activeOnSeat.length === 0) {
    return { ok: true }
  }

  // If new assignment is dedicated, no one else can be on this seat
  if (planType === 'dedicated') {
    return {
      ok: false,
      error: `This seat is already occupied by ${activeOnSeat.map((m: any) => m.full_name).join(', ')} and cannot be booked as Dedicated (24H).`,
    }
  }

  // If new assignment is morning or evening
  const hasDedicated = activeOnSeat.some((m: any) => !m.plan_type || m.plan_type === 'dedicated')
  if (hasDedicated) {
    return {
      ok: false,
      error: 'This seat is occupied 24 hours by a Dedicated member.',
    }
  }

  const hasSameShift = activeOnSeat.some((m: any) => m.plan_type === planType)
  if (hasSameShift) {
    return {
      ok: false,
      error: `This seat is already occupied for the ${planType} shift.`,
    }
  }

  return { ok: true }
}

export async function createMemberAction(values: MemberFormValues) {
  const supabase = await createClient()

  if (values.space_type === 'individual_seat' && values.assigned_seat_id) {
    const check = await validateSeatAvailability(
      supabase,
      values.assigned_seat_id,
      values.plan_type || 'dedicated'
    )
    if (!check.ok) return { error: check.error }
  }

  const { data, error } = await supabase
    .from('members')
    .insert({
      full_name:        values.full_name,
      phone:            values.phone || null,
      email:            values.email || null,
      joining_date:     values.joining_date,
      space_type:       values.space_type,
      plan_type:        values.space_type === 'individual_seat' ? values.plan_type || 'dedicated' : null,
      assigned_seat_id: values.space_type === 'individual_seat' ? values.assigned_seat_id || null : null,
      assigned_room_id: values.space_type === 'complete_room'   ? values.assigned_room_id || null : null,
      monthly_amount:   values.monthly_amount,
      security_deposit: values.security_deposit || 0,
      notes:            values.notes || null,
      status:           'active',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/members')
  revalidatePath('/spaces')
  revalidatePath('/dashboard')
  redirect(`/members/${data.id}`)
}

export async function updateMemberAction(id: string, values: Partial<MemberFormValues>) {
  const supabase = await createClient()

  if (values.space_type === 'individual_seat' && values.assigned_seat_id) {
    const check = await validateSeatAvailability(
      supabase,
      values.assigned_seat_id,
      values.plan_type || 'dedicated',
      id
    )
    if (!check.ok) return { error: check.error }
  }

  const { error } = await supabase
    .from('members')
    .update({
      full_name:        values.full_name,
      phone:            values.phone || null,
      email:            values.email || null,
      joining_date:     values.joining_date,
      space_type:       values.space_type,
      plan_type:        values.space_type === 'individual_seat' ? values.plan_type || 'dedicated' : null,
      assigned_seat_id: values.space_type === 'individual_seat' ? values.assigned_seat_id || null : null,
      assigned_room_id: values.space_type === 'complete_room'   ? values.assigned_room_id || null : null,
      monthly_amount:   values.monthly_amount,
      security_deposit: values.security_deposit,
      notes:            values.notes || null,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/members/${id}`)
  revalidatePath('/members')
  revalidatePath('/spaces')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function markMemberLeftAction(
  id: string,
  leavingDate: string,
  refundDeposit?: { amount: number; date: string }
) {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {
    status:       'left',
    leaving_date: leavingDate,
    // Release assigned space immediately
    assigned_seat_id: null,
    assigned_room_id: null,
    updated_at:   new Date().toISOString(),
  }

  if (refundDeposit) {
    updateData.deposit_refunded      = true
    updateData.deposit_refund_date   = refundDeposit.date
    updateData.deposit_refund_amount = refundDeposit.amount
  }

  const { error } = await supabase
    .from('members')
    .update(updateData)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/members/${id}`)
  revalidatePath('/members')
  revalidatePath('/spaces')
  revalidatePath('/dashboard')
  return { success: true }
}

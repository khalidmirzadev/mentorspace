'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { MemberFormValues } from '@/types'

export async function createMemberAction(values: MemberFormValues) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('members')
    .insert({
      full_name:        values.full_name,
      phone:            values.phone || null,
      email:            values.email || null,
      joining_date:     values.joining_date,
      space_type:       values.space_type,
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

  const { error } = await supabase
    .from('members')
    .update({
      full_name:        values.full_name,
      phone:            values.phone || null,
      email:            values.email || null,
      joining_date:     values.joining_date,
      space_type:       values.space_type,
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
    // Unassign space
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

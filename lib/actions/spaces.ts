'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { RoomFormValues, SeatFormValues } from '@/types'

// ── Rooms ──────────────────────────────────────────────────────────

export async function createRoomAction(values: RoomFormValues) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('rooms')
    .insert({
      name:         values.name,
      description:  values.description || null,
      capacity:     values.capacity || 1,
      room_type:    values.room_type || 'private',
      monthly_rate: values.monthly_rate ?? null,
      is_active:    true,
    })

  if (error) return { error: error.message }

  revalidatePath('/spaces')
  revalidatePath('/dashboard')
  redirect('/spaces')
}

export async function updateRoomAction(id: string, values: Partial<RoomFormValues>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('rooms')
    .update({
      name:         values.name,
      description:  values.description || null,
      capacity:     values.capacity,
      room_type:    values.room_type,
      monthly_rate: values.monthly_rate ?? null,
      updated_at:   new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/spaces')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteRoomAction(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('rooms')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/spaces')
  revalidatePath('/dashboard')
  return { success: true }
}

// ── Seats ──────────────────────────────────────────────────────────

export async function createSeatAction(values: SeatFormValues) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('seats')
    .insert({
      seat_number:  values.seat_number,
      room_id:      values.room_id || null,
      description:  values.description || null,
      monthly_rate: values.monthly_rate ?? null,
      is_active:    true,
    })

  if (error) return { error: error.message }

  revalidatePath('/spaces')
  revalidatePath('/dashboard')
  redirect('/spaces')
}

export async function updateSeatAction(id: string, values: Partial<SeatFormValues>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('seats')
    .update({
      seat_number:  values.seat_number,
      room_id:      values.room_id || null,
      description:  values.description || null,
      monthly_rate: values.monthly_rate ?? null,
      updated_at:   new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/spaces')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteSeatAction(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('seats')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/spaces')
  revalidatePath('/dashboard')
  return { success: true }
}

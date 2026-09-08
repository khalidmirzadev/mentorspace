'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { recalculatePaymentStatus } from '@/lib/utils/payment-generator'
import type { RecordPaymentValues } from '@/types'

/** Record a payment transaction and update the payment status */
export async function recordPaymentAction(
  paymentId: string,
  values: RecordPaymentValues
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('payment_transactions')
    .insert({
      payment_id:     paymentId,
      amount:         values.amount,
      paid_on:        values.paid_on,
      payment_method: values.payment_method || null,
      notes:          values.notes || null,
    })

  if (error) return { error: error.message }

  // Recalculate status after inserting transaction
  await recalculatePaymentStatus(paymentId)

  revalidatePath('/payments')
  revalidatePath('/dashboard')
  return { success: true }
}

/** Update payment notes */
export async function updatePaymentNotesAction(paymentId: string, notes: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('member_payments')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('id', paymentId)

  if (error) return { error: error.message }
  revalidatePath('/payments')
  return { success: true }
}

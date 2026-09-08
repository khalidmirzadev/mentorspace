'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { StaffFormValues, AdvanceFormValues } from '@/types'

export async function createStaffAction(values: StaffFormValues) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('staff')
    .insert({
      full_name:      values.full_name,
      phone:          values.phone || null,
      joining_date:   values.joining_date,
      monthly_salary: values.monthly_salary,
      role:           values.role || null,
      notes:          values.notes || null,
      status:         'active',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/staff')
  redirect(`/staff/${data.id}`)
}

export async function updateStaffAction(id: string, values: Partial<StaffFormValues>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('staff')
    .update({
      full_name:      values.full_name,
      phone:          values.phone || null,
      monthly_salary: values.monthly_salary,
      role:           values.role || null,
      notes:          values.notes || null,
      updated_at:     new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/staff/${id}`)
  revalidatePath('/staff')
  return { success: true }
}

export async function markStaffLeftAction(id: string, leavingDate: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('staff')
    .update({ status: 'left', leaving_date: leavingDate, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/staff/${id}`)
  revalidatePath('/staff')
  return { success: true }
}

export async function recordAdvanceAction(staffId: string, values: AdvanceFormValues) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('staff_advances')
    .insert({
      staff_id:     staffId,
      advance_date: values.advance_date,
      amount:       values.amount,
      reason:       values.reason || null,
      notes:        values.notes || null,
      status:       'outstanding',
    })

  if (error) return { error: error.message }

  revalidatePath(`/staff/${staffId}`)
  return { success: true }
}

export async function paySalaryAction(
  salaryId: string | null | undefined,
  staffId: string,
  netPaid: number,
  advanceDeducted: number,
  paidOn: string,
  paymentMethod: string,
  advanceIds: string[],
  deductionPerAdvance: Record<string, number>,
  billingMonth?: string,
  baseSalary?: number
) {
  const supabase = await createClient()

  // 1. Mark salary as paid or insert new paid salary record
  if (salaryId) {
    const { error: salErr } = await supabase
      .from('staff_salaries')
      .update({
        payment_status:   'paid',
        advance_deducted: advanceDeducted,
        net_paid:         netPaid,
        paid_on:          paidOn,
        payment_method:   paymentMethod || null,
        updated_at:       new Date().toISOString(),
      })
      .eq('id', salaryId)

    if (salErr) return { error: salErr.message }
  } else {
    const month = billingMonth || new Date().toISOString().slice(0, 7) + '-01'
    const base = baseSalary ?? (netPaid + advanceDeducted)

    const { error: insErr } = await supabase
      .from('staff_salaries')
      .insert({
        staff_id:         staffId,
        billing_month:    month,
        base_salary:      base,
        advance_deducted: advanceDeducted,
        net_paid:         netPaid,
        payment_status:   'paid',
        paid_on:          paidOn,
        payment_method:   paymentMethod || null,
      })

    if (insErr) return { error: insErr.message }
  }

  // 2. Update each advance's amount_repaid
  for (const advId of advanceIds) {
    const deduction = deductionPerAdvance[advId] ?? 0
    if (deduction <= 0) continue

    const { data: adv } = await supabase
      .from('staff_advances')
      .select('amount, amount_repaid')
      .eq('id', advId)
      .single()

    if (!adv) continue

    const newRepaid = Math.min(adv.amount, (adv.amount_repaid ?? 0) + deduction)
    const newStatus = newRepaid >= adv.amount ? 'cleared' : 'partially_repaid'

    await supabase
      .from('staff_advances')
      .update({ amount_repaid: newRepaid, status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', advId)
  }

  // 3. Create corresponding expense record (Salaries category)
  const { data: cat } = await supabase
    .from('expense_categories')
    .select('id')
    .eq('slug', 'salaries')
    .maybeSingle()

  if (cat) {
    const { data: staffData } = await supabase
      .from('staff')
      .select('full_name')
      .eq('id', staffId)
      .single()

    await supabase.from('expenses').insert({
      category_id:    cat.id,
      expense_date:   paidOn,
      amount:         netPaid,
      description:    `Salary paid to ${staffData?.full_name ?? 'staff'}`,
      payment_method: paymentMethod || null,
    })
  }

  revalidatePath(`/staff/${staffId}`)
  revalidatePath('/staff')
  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  return { success: true }
}

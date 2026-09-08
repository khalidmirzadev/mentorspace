import { createClient } from '@/lib/supabase/server'
import type { PaymentStatus } from '@/types'
import { currentBillingMonth, toBillingMonth } from '@/lib/utils/formatters'

/**
 * Generate monthly payment records for all active members.
 * Safe to call multiple times — idempotent via UNIQUE(member_id, billing_month).
 *
 * @param billingMonth - ISO date '2025-01-01'. Defaults to current month.
 * @returns summary of records created / skipped
 */
export async function generateMonthlyPayments(billingMonth?: string) {
  const supabase = await createClient()
  const month = billingMonth ?? currentBillingMonth()

  // Parse due date (5th of the billing month)
  const [year, mon] = month.split('-').map(Number)
  const dueDate = `${year}-${String(mon).padStart(2, '0')}-05`

  // Fetch all active members who should have a payment this month
  const { data: members, error: fetchErr } = await supabase
    .from('members')
    .select('id, full_name, monthly_amount, joining_date, leaving_date, status')
    .eq('status', 'active')

  if (fetchErr) throw fetchErr
  if (!members?.length) return { created: 0, skipped: 0 }

  const billingMonthDate = new Date(month)
  const lastDayOfMonth = new Date(year, mon, 0) // last day of billing month

  let created = 0
  let skipped = 0

  for (const member of members) {
    const joiningDate = new Date(member.joining_date)
    const leavingDate = member.leaving_date ? new Date(member.leaving_date) : null

    // Skip if member joined after the end of this billing month
    if (joiningDate > lastDayOfMonth) { skipped++; continue }

    // Skip if member left before this billing month started
    if (leavingDate && leavingDate < billingMonthDate) { skipped++; continue }

    const { error } = await supabase
      .from('member_payments')
      .insert({
        member_id:      member.id,
        billing_month:  month,
        amount_due:     member.monthly_amount,
        amount_paid:    0,
        payment_status: 'pending',
        due_date:       dueDate,
      })
      // Ignore conflict — record already exists for this month
      // Supabase JS doesn't have onConflictDoNothing, so we check the error code
      .select()
      .maybeSingle()

    if (error) {
      if (error.code === '23505') { skipped++; continue } // unique constraint violation
      throw error
    }
    created++
  }

  return { created, skipped, billing_month: month }
}

/**
 * Recalculate payment status for a payment record based on amount_paid vs amount_due.
 * Should be called after every payment transaction.
 */
export async function recalculatePaymentStatus(paymentId: string) {
  const supabase = await createClient()

  // Sum all transactions
  const { data: transactions, error: txErr } = await supabase
    .from('payment_transactions')
    .select('amount')
    .eq('payment_id', paymentId)

  if (txErr) throw txErr

  const totalPaid = transactions?.reduce((sum, tx) => sum + tx.amount, 0) ?? 0

  // Get the payment record
  const { data: payment, error: pmtErr } = await supabase
    .from('member_payments')
    .select('amount_due, due_date')
    .eq('id', paymentId)
    .single()

  if (pmtErr) throw pmtErr

  const today = new Date().toISOString().split('T')[0]
  const isOverdue = today > payment.due_date

  let status: PaymentStatus
  if (totalPaid <= 0) {
    status = isOverdue ? 'overdue' : 'pending'
  } else if (totalPaid >= payment.amount_due) {
    status = 'paid'
  } else {
    status = isOverdue ? 'overdue' : 'partially_paid'
  }

  const lastTx = transactions?.[transactions.length - 1]

  const { error: updateErr } = await supabase
    .from('member_payments')
    .update({
      amount_paid:    totalPaid,
      payment_status: status,
      payment_date:   lastTx ? new Date().toISOString().split('T')[0] : null,
      updated_at:     new Date().toISOString(),
    })
    .eq('id', paymentId)

  if (updateErr) throw updateErr

  return { amount_paid: totalPaid, status }
}

/**
 * Auto-mark overdue: any pending/partially_paid payments past their due_date
 * become 'overdue'. Safe to run daily via cron.
 */
export async function markOverduePayments() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('member_payments')
    .update({ payment_status: 'overdue', updated_at: new Date().toISOString() })
    .in('payment_status', ['pending', 'partially_paid'])
    .lt('due_date', today)

  if (error) throw error
}

/**
 * Generate monthly salary records for all active staff.
 * Same idempotent pattern as member payments.
 */
export async function generateMonthlyStaffSalaries(billingMonth?: string) {
  const supabase = await createClient()
  const month = billingMonth ?? currentBillingMonth()

  const { data: staffList, error } = await supabase
    .from('staff')
    .select('id, monthly_salary')
    .eq('status', 'active')

  if (error) throw error
  if (!staffList?.length) return { created: 0, skipped: 0 }

  let created = 0
  let skipped = 0

  for (const member of staffList) {
    const { error: insertErr } = await supabase
      .from('staff_salaries')
      .insert({
        staff_id:        member.id,
        billing_month:   month,
        base_salary:     member.monthly_salary,
        advance_deducted: 0,
        net_paid:        member.monthly_salary,
        payment_status:  'pending',
      })

    if (insertErr) {
      if (insertErr.code === '23505') { skipped++; continue }
      throw insertErr
    }
    created++
  }

  return { created, skipped, billing_month: month }
}

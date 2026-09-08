import { createClient } from '@/lib/supabase/server'
import type { Staff, StaffSalary, StaffAdvance } from '@/types'

export async function getStaffMember(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('staff')
    .select('*')
    .eq('id', id)
    .single()
  return data as Staff | null
}

export async function getStaffSalaries(staffId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('staff_salaries')
    .select('*')
    .eq('staff_id', staffId)
    .order('billing_month', { ascending: false })
  return (data ?? []) as StaffSalary[]
}

export async function getStaffAdvances(staffId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('staff_advances')
    .select('*')
    .eq('staff_id', staffId)
    .order('advance_date', { ascending: false })
  // Add computed remaining
  return (data ?? []).map((a: any) => ({
    ...a,
    remaining: a.amount - a.amount_repaid,
  })) as (StaffAdvance & { remaining: number })[]
}

export async function getOutstandingAdvances(staffId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('staff_advances')
    .select('*')
    .eq('staff_id', staffId)
    .in('status', ['outstanding', 'partially_repaid'])
    .order('advance_date')
  return (data ?? []).map((a: any) => ({
    ...a,
    remaining: a.amount - a.amount_repaid,
  })) as (StaffAdvance & { remaining: number })[]
}

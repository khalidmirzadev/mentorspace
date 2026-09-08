import { createClient } from '@/lib/supabase/server'
import type { Expense } from '@/types'

export async function getExpense(id: string): Promise<Expense | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select(`*, category:expense_categories(*)`)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Expense
}

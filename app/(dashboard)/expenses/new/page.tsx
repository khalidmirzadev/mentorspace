import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ExpenseForm from '@/components/expenses/ExpenseForm'
import PageHeader from '@/components/shared/PageHeader'
import type { ExpenseCategory } from '@/types'

export const metadata: Metadata = { title: 'Add Expense' }

export default async function NewExpensePage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('expense_categories')
    .select('*')
    .order('sort_order')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Expense"
        description="Record a new office or operational expense"
        backHref="/expenses"
        backLabel="Expenses"
      />
      <ExpenseForm categories={(categories ?? []) as ExpenseCategory[]} />
    </div>
  )
}

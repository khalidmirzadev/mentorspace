import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getExpense } from '@/lib/queries/expenses'
import ExpenseForm from '@/components/expenses/ExpenseForm'
import PageHeader from '@/components/shared/PageHeader'
import type { ExpenseCategory } from '@/types'

export const metadata: Metadata = { title: 'Edit Expense' }

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [expense, { data: categories }] = await Promise.all([
    getExpense(id),
    supabase.from('expense_categories').select('*').order('sort_order'),
  ])

  if (!expense) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit Expense — ${expense.description}`}
        description="Update category, amount, date, vendor, or payment details"
        backHref="/expenses"
        backLabel="Expenses"
      />
      <ExpenseForm
        categories={(categories ?? []) as ExpenseCategory[]}
        expense={expense}
      />
    </div>
  )
}

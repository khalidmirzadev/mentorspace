'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ExpenseFormValues, GrocerySessionFormValues, GeneratorExpenseFormValues } from '@/types'

// ── General Expenses ──────────────────────────────────────────────

export async function createExpenseAction(values: ExpenseFormValues) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('expenses')
    .insert({
      category_id:    values.category_id,
      expense_date:   values.expense_date,
      amount:         values.amount,
      description:    values.description,
      vendor:         values.vendor || null,
      payment_method: values.payment_method || null,
      notes:          values.notes || null,
    })

  if (error) return { error: error.message }

  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  revalidatePath('/reports')
  redirect('/expenses')
}

export async function updateExpenseAction(id: string, values: ExpenseFormValues) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('expenses')
    .update({
      category_id:    values.category_id,
      expense_date:   values.expense_date,
      amount:         values.amount,
      description:    values.description,
      vendor:         values.vendor || null,
      payment_method: values.payment_method || null,
      notes:          values.notes || null,
      updated_at:     new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  revalidatePath('/reports')
  redirect('/expenses')
}

export async function deleteExpenseAction(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  return { success: true }
}

// ── Grocery ───────────────────────────────────────────────────────

export async function createGrocerySessionAction(values: GrocerySessionFormValues) {
  const supabase = await createClient()

  // 1. Get grocery category id
  const { data: cat } = await supabase
    .from('expense_categories')
    .select('id')
    .eq('slug', 'grocery')
    .single()

  // 2. Create expense record
  const { data: expense, error: expErr } = await supabase
    .from('expenses')
    .insert({
      category_id:  cat?.id,
      expense_date: values.session_date,
      amount:       values.items.reduce((s, i) => s + i.total_price, 0),
      description:  `Grocery — ${values.vendor || 'Shop'}`,
      vendor:       values.vendor || null,
      notes:        values.notes || null,
    })
    .select('id')
    .single()

  if (expErr) return { error: expErr.message }

  // 3. Create grocery session
  const { data: session, error: sessErr } = await supabase
    .from('grocery_sessions')
    .insert({
      session_date: values.session_date,
      vendor:       values.vendor || null,
      total_amount: values.items.reduce((s, i) => s + i.total_price, 0),
      notes:        values.notes || null,
      expense_id:   expense?.id,
    })
    .select('id')
    .single()

  if (sessErr) return { error: sessErr.message }

  // 4. Insert items
  if (values.items.length > 0) {
    const { error: itemsErr } = await supabase
      .from('grocery_items')
      .insert(values.items.map(item => ({
        grocery_session_id: session!.id,
        item_name:   item.item_name,
        quantity:    item.quantity || null,
        unit_price:  item.unit_price ?? null,
        total_price: item.total_price,
      })))

    if (itemsErr) return { error: itemsErr.message }
  }

  revalidatePath('/grocery')
  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  redirect('/grocery')
}

// ── Generator ─────────────────────────────────────────────────────

export async function createGeneratorExpenseAction(values: GeneratorExpenseFormValues) {
  const supabase = await createClient()

  // Get category id
  const slug = values.type === 'fuel' ? 'generator_fuel' : 'generator_maintenance'
  const { data: cat } = await supabase
    .from('expense_categories')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  // Fallback to generator_maintenance category
  const finalCat = cat ?? (await supabase
    .from('expense_categories')
    .select('id')
    .eq('slug', 'generator_maintenance')
    .single()
  ).data

  // Create parent expense
  const { data: expense, error: expErr } = await supabase
    .from('expenses')
    .insert({
      category_id:    finalCat?.id,
      expense_date:   values.expense_date,
      amount:         values.total_amount,
      description:    values.description || `Generator ${values.type}`,
      vendor:         values.vendor || null,
      payment_method: values.payment_method || null,
      notes:          values.notes || null,
    })
    .select('id')
    .single()

  if (expErr) return { error: expErr.message }

  // Create generator expense record
  const { error: genErr } = await supabase
    .from('generator_expenses')
    .insert({
      expense_date:   values.expense_date,
      type:           values.type,
      fuel_liters:    values.fuel_liters ?? null,
      cost_per_liter: values.cost_per_liter ?? null,
      total_amount:   values.total_amount,
      vendor:         values.vendor || null,
      description:    values.description || null,
      payment_method: values.payment_method || null,
      notes:          values.notes || null,
      expense_id:     expense?.id,
    })

  if (genErr) return { error: genErr.message }

  revalidatePath('/generator')
  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  redirect('/generator')
}

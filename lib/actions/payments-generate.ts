'use server'

import { revalidatePath } from 'next/cache'
import { generateMonthlyPayments } from '@/lib/utils/payment-generator'

export async function generateMonthlyPaymentsAction(billingMonth: string) {
  try {
    const result = await generateMonthlyPayments(billingMonth)
    revalidatePath('/payments')
    revalidatePath('/dashboard')
    return { ...result, error: null }
  } catch (err: any) {
    return { created: 0, skipped: 0, error: err.message }
  }
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateSettingsAction(entries: Record<string, string>) {
  const supabase = await createClient()

  for (const [key, value] of Object.entries(entries)) {
    const { error } = await supabase
      .from('app_settings')
      .upsert({
        key,
        value: String(value),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })

    if (error) return { error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  revalidatePath('/payments')
  return { success: true }
}

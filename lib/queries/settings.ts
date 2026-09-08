import { createClient } from '@/lib/supabase/server'
import type { AppSetting, AppSettings } from '@/types'

export async function getAppSettings(): Promise<AppSettings> {
  const supabase = await createClient()
  const { data } = await supabase.from('app_settings').select('*')

  const defaultSettings: AppSettings = {
    payment_due_day_start: '1',
    payment_due_day_end:   '5',
    currency:              'PKR',
    currency_symbol:       'Rs.',
    space_name:            'MentorSpace',
    overdue_auto_mark:     'true',
  }

  if (!data || data.length === 0) return defaultSettings

  const settingsMap = (data as AppSetting[]).reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value
    return acc
  }, {})

  return {
    payment_due_day_start: settingsMap['payment_due_day_start'] ?? defaultSettings.payment_due_day_start,
    payment_due_day_end:   settingsMap['payment_due_day_end']   ?? defaultSettings.payment_due_day_end,
    currency:              settingsMap['currency']              ?? defaultSettings.currency,
    currency_symbol:       settingsMap['currency_symbol']       ?? defaultSettings.currency_symbol,
    space_name:            settingsMap['space_name']            ?? defaultSettings.space_name,
    overdue_auto_mark:     settingsMap['overdue_auto_mark']     ?? defaultSettings.overdue_auto_mark,
  }
}

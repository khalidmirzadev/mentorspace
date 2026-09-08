import type { Metadata } from 'next'
import { getAppSettings } from '@/lib/queries/settings'
import SettingsForm from '@/components/settings/SettingsForm'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const settings = await getAppSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Workspace configuration, currency, and payment schedules</p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  )
}

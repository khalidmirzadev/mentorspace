'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { updateSettingsAction } from '@/lib/actions/settings'
import type { AppSettings } from '@/types'
import { AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react'

interface SettingsFormProps {
  settings: AppSettings
}

export default function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [overdueAutoMark, setOverdueAutoMark] = useState(settings.overdue_auto_mark === 'true')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)

    const entries: Record<string, string> = {
      space_name:            (fd.get('space_name') as string) || 'MentorSpace',
      currency:              (fd.get('currency') as string) || 'PKR',
      currency_symbol:       (fd.get('currency_symbol') as string) || 'Rs.',
      payment_due_day_start: (fd.get('payment_due_day_start') as string) || '1',
      payment_due_day_end:   (fd.get('payment_due_day_end') as string) || '5',
      overdue_auto_mark:     overdueAutoMark ? 'true' : 'false',
    }

    startTransition(async () => {
      const res = await updateSettingsAction(entries)
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccess(true)
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-900/40 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>Settings saved successfully.</AlertDescription>
        </Alert>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">General Workspace Settings</CardTitle>
          <CardDescription>Configure workspace branding and currency formatting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="space_name">Coworking Space Name *</Label>
            <Input
              id="space_name"
              name="space_name"
              required
              defaultValue={settings.space_name}
              placeholder="MentorSpace"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency Code</Label>
              <Input
                id="currency"
                name="currency"
                required
                defaultValue={settings.currency}
                placeholder="PKR"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency_symbol">Currency Display Symbol</Label>
              <Input
                id="currency_symbol"
                name="currency_symbol"
                required
                defaultValue={settings.currency_symbol}
                placeholder="Rs."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing & Due Dates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Billing & Due Dates</CardTitle>
          <CardDescription>Define the monthly rent collection cycle</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="payment_due_day_start">Billing Period Start (Day of month)</Label>
              <Input
                id="payment_due_day_start"
                name="payment_due_day_start"
                type="number"
                min="1"
                max="28"
                required
                defaultValue={settings.payment_due_day_start}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment_due_day_end">Payment Due Day (Day of month)</Label>
              <Input
                id="payment_due_day_end"
                name="payment_due_day_end"
                type="number"
                min="1"
                max="28"
                required
                defaultValue={settings.payment_due_day_end}
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="overdue_auto_mark"
              className="w-4 h-4 accent-indigo-600 rounded"
              checked={overdueAutoMark}
              onChange={e => setOverdueAutoMark(e.target.checked)}
            />
            <div>
              <Label htmlFor="overdue_auto_mark" className="cursor-pointer font-medium text-sm">
                Automatically mark unpaid payments as Overdue
              </Label>
              <p className="text-xs text-muted-foreground">
                When active, any unpaid payment past the 5th of the month will be shown with an overdue warning.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-500"
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Settings</>
          )}
        </Button>
      </div>
    </form>
  )
}

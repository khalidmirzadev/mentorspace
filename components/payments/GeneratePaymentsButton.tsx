'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { generateMonthlyPaymentsAction } from '@/lib/actions/payments-generate'
import { RefreshCw, Loader2 } from 'lucide-react'

export default function GeneratePaymentsButton({ billingMonth }: { billingMonth: string }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)

  function handleGenerate() {
    startTransition(async () => {
      const res = await generateMonthlyPaymentsAction(billingMonth)
      if (res.error) setResult(`Error: ${res.error}`)
      else setResult(`Created ${res.created} records, ${res.skipped} skipped`)
      setTimeout(() => setResult(null), 4000)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isPending}>
        {isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
        Generate Records
      </Button>
      {result && <span className="text-xs text-muted-foreground">{result}</span>}
    </div>
  )
}

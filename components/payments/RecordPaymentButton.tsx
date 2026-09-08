'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard } from 'lucide-react'
import RecordPaymentDialog from './RecordPaymentDialog'

interface RecordPaymentButtonProps {
  paymentId: string
  amountDue: number
  amountPaid: number
  remaining: number
  isPaid: boolean
}

export default function RecordPaymentButton({
  paymentId, amountDue, amountPaid, remaining, isPaid
}: RecordPaymentButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-500"
        disabled={isPaid}
      >
        <CreditCard className="w-4 h-4 mr-2" />
        {isPaid ? 'Fully Paid' : 'Record Payment'}
      </Button>
      <RecordPaymentDialog
        paymentId={paymentId}
        amountDue={amountDue}
        amountPaid={amountPaid}
        remaining={remaining}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { createExpenseAction } from '@/lib/actions/expenses'
import type { ExpenseCategory, PaymentMethod } from '@/types'
import { AlertCircle, Loader2 } from 'lucide-react'

interface ExpenseFormProps {
  categories: ExpenseCategory[]
}

export default function ExpenseForm({ categories }: ExpenseFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const todayStr = new Date().toISOString().split('T')[0]
  const [categoryId, setCategoryId] = useState<string>(
    categories[0]?.id ? String(categories[0].id) : ''
  )
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('cash')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    const values = {
      category_id:    parseInt(categoryId, 10),
      expense_date:   fd.get('expense_date') as string,
      amount:         parseFloat(fd.get('amount') as string) || 0,
      description:    fd.get('description') as string,
      vendor:         fd.get('vendor') as string,
      payment_method: paymentMethod,
      notes:          fd.get('notes') as string,
    }

    if (isNaN(values.category_id)) {
      setError('Please select an expense category.')
      return
    }

    if (values.amount <= 0) {
      setError('Please enter a valid amount greater than 0.')
      return
    }

    startTransition(async () => {
      const res = await createExpenseAction(values)
      if (res?.error) setError(res.error)
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

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Expense Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category">Category *</Label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expense_date">Date *</Label>
              <Input
                id="expense_date"
                name="expense_date"
                type="date"
                required
                defaultValue={todayStr}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (Rs.) *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="1"
                step="0.01"
                required
                placeholder="5000"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="online">Online Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              name="description"
              required
              placeholder="e.g. Internet Bill for October, Office Supplies, Tea & Refreshments"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vendor">Vendor / Paid To</Label>
            <Input
              id="vendor"
              name="vendor"
              placeholder="e.g. Nayatel, Metro, Electricity Dept"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Any additional information..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-500"
        >
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : 'Add Expense'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

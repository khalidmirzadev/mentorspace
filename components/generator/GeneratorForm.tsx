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
import { createGeneratorExpenseAction } from '@/lib/actions/expenses'
import { formatCurrency } from '@/lib/utils/formatters'
import type { GeneratorExpenseType, PaymentMethod } from '@/types'
import { AlertCircle, Loader2, Zap } from 'lucide-react'

export default function GeneratorForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const todayStr = new Date().toISOString().split('T')[0]
  const [expenseDate, setExpenseDate] = useState(todayStr)
  const [type, setType] = useState<GeneratorExpenseType>('fuel')
  const [liters, setLiters] = useState<string>('50')
  const [costPerLiter, setCostPerLiter] = useState<string>('280')
  const [manualTotal, setManualTotal] = useState<string>('')
  const [vendor, setVendor] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('cash')
  const [notes, setNotes] = useState('')

  // Calculate total: if fuel, liters * rate; otherwise manualTotal
  const computedFuelTotal = (parseFloat(liters) || 0) * (parseFloat(costPerLiter) || 0)
  const finalTotal = type === 'fuel'
    ? (manualTotal !== '' ? parseFloat(manualTotal) || 0 : computedFuelTotal)
    : parseFloat(manualTotal) || 0

  function handleTypeChange(newType: GeneratorExpenseType) {
    setType(newType)
    if (newType !== 'fuel') {
      setManualTotal('')
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (finalTotal <= 0) {
      setError('Please enter a total expense amount greater than 0.')
      return
    }

    const values = {
      expense_date:   expenseDate,
      type,
      fuel_liters:    type === 'fuel' ? parseFloat(liters) || null : null,
      cost_per_liter: type === 'fuel' ? parseFloat(costPerLiter) || null : null,
      total_amount:   finalTotal,
      vendor:         vendor.trim(),
      description:    description.trim() || `Generator ${type}`,
      payment_method: paymentMethod,
      notes:          notes.trim(),
    }

    startTransition(async () => {
      const res = await createGeneratorExpenseAction(values)
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
              <Label htmlFor="type">Expense Type *</Label>
              <Select value={type} onValueChange={(v) => v && handleTypeChange(v as GeneratorExpenseType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fuel">Fuel (Diesel / Petrol)</SelectItem>
                  <SelectItem value="maintenance">Maintenance & Oil Change</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expense_date">Date *</Label>
              <Input
                id="expense_date"
                type="date"
                required
                value={expenseDate}
                onChange={e => setExpenseDate(e.target.value)}
              />
            </div>
          </div>

          {/* Fuel Specific Fields */}
          {type === 'fuel' ? (
            <div className="p-4 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-orange-800 dark:text-orange-300 uppercase tracking-wide">
                Fuel Calculation
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="liters">Fuel Quantity (Liters) *</Label>
                  <Input
                    id="liters"
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    placeholder="50"
                    value={liters}
                    onChange={e => setLiters(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="costPerLiter">Price per Liter (Rs.) *</Label>
                  <Input
                    id="costPerLiter"
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    placeholder="280"
                    value={costPerLiter}
                    onChange={e => setCostPerLiter(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-muted-foreground">Calculated Cost:</span>
                <span className="font-bold text-base text-orange-700 dark:text-orange-400">
                  {formatCurrency(computedFuelTotal, 'Rs.')}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="total_amount">Total Amount (Rs.) *</Label>
              <Input
                id="total_amount"
                type="number"
                min="1"
                step="0.01"
                required
                placeholder="e.g. 7500"
                value={manualTotal}
                onChange={e => setManualTotal(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vendor">Vendor / Station / Mechanic</Label>
              <Input
                id="vendor"
                placeholder="e.g. PSO Petrol Station, Generator Mechanic"
                value={vendor}
                onChange={e => setVendor(e.target.value)}
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
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder={type === 'fuel' ? 'e.g. 50L Diesel refuel for power backup' : 'e.g. Mobil oil change and filter replacement'}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Any additional notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
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
          {isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
          ) : (
            <><Zap className="w-4 h-4 mr-2" /> Save Generator Expense ({formatCurrency(finalTotal, 'Rs.')})</>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

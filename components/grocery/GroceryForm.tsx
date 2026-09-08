'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { createGrocerySessionAction } from '@/lib/actions/expenses'
import { formatCurrency } from '@/lib/utils/formatters'
import { AlertCircle, Loader2, Plus, Trash2, ShoppingCart } from 'lucide-react'

interface ItemRow {
  id: string
  item_name: string
  quantity: string
  unit_price: number | null
  total_price: number
}

export default function GroceryForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const todayStr = new Date().toISOString().split('T')[0]
  const [sessionDate, setSessionDate] = useState(todayStr)
  const [vendor, setVendor] = useState('')
  const [notes, setNotes] = useState('')

  const [items, setItems] = useState<ItemRow[]>([
    { id: '1', item_name: 'Tea / Chai Patti', quantity: '1 pack', unit_price: null, total_price: 1200 },
    { id: '2', item_name: 'Milk / Tetra Pack', quantity: '6 liters', unit_price: null, total_price: 1800 },
    { id: '3', item_name: 'Sugar', quantity: '2 kg', unit_price: null, total_price: 360 },
  ])

  function addItem() {
    setItems(prev => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 9), item_name: '', quantity: '', unit_price: null, total_price: 0 },
    ])
  }

  function removeItem(id: string) {
    if (items.length <= 1) return
    setItems(prev => prev.filter(item => item.id !== id))
  }

  function updateItem(id: string, field: keyof ItemRow, value: any) {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item
        return { ...item, [field]: value }
      })
    )
  }

  const grandTotal = items.reduce((sum, item) => sum + (item.total_price || 0), 0)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const validItems = items.filter(i => i.item_name.trim() !== '')
    if (validItems.length === 0) {
      setError('Please add at least one item with a name.')
      return
    }

    const values = {
      session_date: sessionDate,
      vendor:       vendor.trim(),
      notes:        notes.trim(),
      items:        validItems.map(i => ({
        item_name:   i.item_name.trim(),
        quantity:    i.quantity.trim(),
        unit_price:  i.unit_price,
        total_price: i.total_price || 0,
      })),
    }

    startTransition(async () => {
      const res = await createGrocerySessionAction(values)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Session Details */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Trip Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="session_date">Shopping Date *</Label>
              <Input
                id="session_date"
                type="date"
                required
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vendor">Store / Vendor Name</Label>
              <Input
                id="vendor"
                placeholder="e.g. Metro Cash & Carry, Imtiaz, Local Mart"
                value={vendor}
                onChange={e => setVendor(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Purchased Items ({items.length})
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-3 rounded-lg border bg-card/60"
              >
                <div className="sm:col-span-5 space-y-1">
                  <Label className="text-xs sm:hidden">Item Name</Label>
                  <Input
                    placeholder="Item name (e.g. Coffee)"
                    value={item.item_name}
                    onChange={e => updateItem(item.id, 'item_name', e.target.value)}
                    required
                  />
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <Label className="text-xs sm:hidden">Quantity</Label>
                  <Input
                    placeholder="Qty (e.g. 2 jars)"
                    value={item.quantity}
                    onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                  />
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <Label className="text-xs sm:hidden">Total (Rs.)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Total Rs."
                    value={item.total_price || ''}
                    onChange={e => updateItem(item.id, 'total_price', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Grand Total Bar */}
          <div className="flex justify-between items-center p-4 bg-muted/60 rounded-lg border font-medium">
            <span className="text-sm">Total Grocery Expense:</span>
            <span className="text-lg font-bold text-green-600">{formatCurrency(grandTotal, 'Rs.')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="p-5 space-y-2">
          <Label htmlFor="notes">Notes / Receipt Info</Label>
          <Textarea
            id="notes"
            rows={2}
            placeholder="Any extra notes or invoice reference..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-500"
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
          ) : (
            <><ShoppingCart className="w-4 h-4 mr-2" /> Save Grocery Session ({formatCurrency(grandTotal, 'Rs.')})</>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

import type { Metadata } from 'next'
import GroceryForm from '@/components/grocery/GroceryForm'
import PageHeader from '@/components/shared/PageHeader'

export const metadata: Metadata = { title: 'Add Grocery Session' }

export default function NewGroceryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Grocery Shopping"
        description="Record grocery and refreshment items bought for the space"
        backHref="/grocery"
        backLabel="Grocery"
      />
      <GroceryForm />
    </div>
  )
}
